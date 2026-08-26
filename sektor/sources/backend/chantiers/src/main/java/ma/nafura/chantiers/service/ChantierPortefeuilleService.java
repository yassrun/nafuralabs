package ma.nafura.chantiers.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import ma.nafura.chantiers.api.dto.ChantierAffectationDto;
import ma.nafura.chantiers.api.dto.ChantierPortefeuilleRowDto;
import ma.nafura.chantiers.api.dto.ChantierSummaryDto;
import ma.nafura.chantiers.api.dto.CockpitChantierDto;
import ma.nafura.chantiers.domain.chantier.Chantier;
import ma.nafura.chantiers.repository.ChantierLotRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * Portefeuille chantier décisionnel (cockpit-chantier AC-18, AC-19).
 *
 * <p>Chaque ligne porte les mêmes faits que le cockpit (vente active, budget révisé, marge
 * projetée, échéance/retard, alerte principale, prochaine action), dérivés des mêmes agrégats.
 * Les filtres (statut, sévérité d'alerte, responsable, en retard, marge négative) et les tris
 * (alerte, échéance, marge, avancement) sont exécutés côté serveur ; la pagination est stable.
 * Une valeur non calculable reste {@code null}, jamais zéro (AC-14).
 */
@Service
public class ChantierPortefeuilleService {

    private final ChantierService chantierService;
    private final ChantierSummaryReadService summaryService;
    private final ChantierAffectationService affectationService;
    private final ChantierLotRepository lotRepository;

    public ChantierPortefeuilleService(
            ChantierService chantierService,
            ChantierSummaryReadService summaryService,
            ChantierAffectationService affectationService,
            ChantierLotRepository lotRepository) {
        this.chantierService = chantierService;
        this.summaryService = summaryService;
        this.affectationService = affectationService;
        this.lotRepository = lotRepository;
    }

    public record PortefeuilleQuery(
            String status,
            String severiteAlerte,
            String responsable,
            Boolean enRetard,
            Boolean margeNegative,
            String search,
            String tri,
            String sens,
            int page,
            int size) {
        /** Constructeur de confort sans recherche (P1-18 : la recherche est serveur). */
        public PortefeuilleQuery(
                String status, String severiteAlerte, String responsable,
                Boolean enRetard, Boolean margeNegative, String tri, String sens,
                int page, int size) {
            this(status, severiteAlerte, responsable, enRetard, margeNegative,
                    null, tri, sens, page, size);
        }
    }

    @Transactional(readOnly = true)
    public ChantierPortefeuilleRowDto.Page lister(PortefeuilleQuery q) {
        List<Chantier> tous = chantierService.list(null, null, null, null);
        List<ChantierPortefeuilleRowDto> lignes = tous.stream()
                .map(this::composer)
                .filter(l -> filtrer(l, q))
                .sorted(tri(q))
                .toList();

        int debut = q.page() * q.size();
        int fin = Math.min(debut + q.size(), lignes.size());
        List<ChantierPortefeuilleRowDto> page = debut >= lignes.size()
                ? List.of()
                : lignes.subList(debut, fin);
        return new ChantierPortefeuilleRowDto.Page(
                page, lignes.size(), q.page(), q.size(),
                ChantierFinanceAccess.peutVoirFinance());
    }

    private ChantierPortefeuilleRowDto composer(Chantier c) {
        ChantierSummaryDto s = summaryService.getSummary(c.getId());
        CockpitChantierDto.AlerteDto alerte = CockpitChantierService.alertePrincipale(c, s);
        Integer jours = joursRestantsOuRetard(c);
        List<ChantierAffectationDto> affectations = affectationService.listByChantier(c.getId());
        String responsable = responsable(affectations);
        boolean aConducteur = affectations.stream()
                .anyMatch(a -> "BTP_CONDUCTEUR_TRAVAUX".equals(a.getRoleCode()));
        boolean aChef = affectations.stream()
                .anyMatch(a -> "BTP_CHEF_CHANTIER".equals(a.getRoleCode()));
        long nbLots = lotRepository.countByTenantIdAndChantierId(
                ma.nafura.platform.framework.context.TenantContext.getTenantId(), c.getId());
        // P0-4 — même autorisation effective que le cockpit : sans permission, les montants
        // sont absents de la réponse (jamais zéro, jamais de valeur dans le JSON).
        boolean financeAutorisee = ChantierFinanceAccess.peutVoirFinance();
        return ChantierPortefeuilleRowDto.builder()
                .id(c.getId())
                .code(c.getCode())
                .nom(c.getLabel())
                .client(c.getClientName())
                .status(c.getStatus())
                .responsable(responsable)
                .avancementPercent(c.getAvancementPercent() != null
                        ? c.getAvancementPercent() : null)
                .joursRestantsOuRetard(jours)
                .enRetard(estEnRetard(c))
                .montantVenteActifHt(financeAutorisee ? s.getMontantVenteActifHt() : null)
                .budgetReviseHt(financeAutorisee ? s.getBudgetReviseHt() : null)
                .margeProjeteeHt(financeAutorisee ? s.getMargeProjeteeHt() : null)
                .margeProjeteePct(financeAutorisee ? s.getMargeProjeteePct() : null)
                .alerteCode(alerte != null ? alerte.getCode() : null)
                .alerteSeverite(alerte != null ? alerte.getSeverite() : null)
                .prochaineAction(ChantierActionDecision.premiereAction(
                        c, nbLots, aConducteur, aChef))
                .build();
    }

    /**
     * P2-23 — même convention que le cockpit (AC-13) : valeur = magnitude (jours restants ou
     * jours de retard), direction portée par {@code enRetard} (signe réel, pas la magnitude).
     */
    private Integer joursRestantsOuRetard(Chantier c) {
        if (c.getDateFinPrevue() == null) {
            return null;
        }
        long ecart = java.time.temporal.ChronoUnit.DAYS.between(LocalDate.now(), c.getDateFinPrevue());
        return (int) Math.abs(ecart);
    }

    private static boolean estEnRetard(Chantier c) {
        if (c.getDateFinPrevue() == null) {
            return false;
        }
        return c.getDateFinPrevue().isBefore(LocalDate.now());
    }

    private String responsable(List<ChantierAffectationDto> affectations) {
        return affectations.stream()
                .filter(a -> "BTP_CONDUCTEUR_TRAVAUX".equals(a.getRoleCode()))
                .map(ChantierAffectationDto::getEmployeNom)
                .filter(StringUtils::hasText)
                .findFirst()
                .orElse(null);
    }

    private static boolean filtrer(ChantierPortefeuilleRowDto l, PortefeuilleQuery q) {
        if (StringUtils.hasText(q.status()) && !q.status().equals(l.getStatus())) {
            return false;
        }
        if (StringUtils.hasText(q.severiteAlerte())
                && !q.severiteAlerte().equals(l.getAlerteSeverite())) {
            return false;
        }
        if (StringUtils.hasText(q.responsable())) {
            String r = l.getResponsable();
            if (r == null || !r.toLowerCase(Locale.ROOT).contains(q.responsable().toLowerCase(Locale.ROOT))) {
                return false;
            }
        }
        if (Boolean.TRUE.equals(q.enRetard()) && !l.isEnRetard()) {
            return false;
        }
        if (Boolean.TRUE.equals(q.margeNegative())
                && (l.getMargeProjeteeHt() == null || l.getMargeProjeteeHt().signum() >= 0)) {
            return false;
        }
        // P1-18 — recherche serveur code / nom / client (comme la liste générique).
        if (StringUtils.hasText(q.search())) {
            String term = q.search().trim().toLowerCase(Locale.ROOT);
            boolean match = contains(l.getCode(), term)
                    || contains(l.getNom(), term)
                    || contains(l.getClient(), term);
            if (!match) {
                return false;
            }
        }
        return true;
    }

    private static boolean contains(String valeur, String terme) {
        return valeur != null && valeur.toLowerCase(Locale.ROOT).contains(terme);
    }

    /**
     * P1-20 — tri serveur stable : nulls-last dans les DEUX sens, sens appliqué à la seule
     * valeur, tie-breaker (code puis id) toujours ascendant → ordre total déterministe.
     */
    private static Comparator<ChantierPortefeuilleRowDto> tri(PortefeuilleQuery q) {
        boolean desc = "desc".equalsIgnoreCase(q.sens());
        Comparator<ChantierPortefeuilleRowDto> principal = switch (q.tri() == null ? "" : q.tri()) {
            case "alerte" -> comparingNullable(
                    ChantierPortefeuilleRowDto::getAlerteSeverite,
                    Comparator.comparingInt(ChantierPortefeuilleService::severiteRang), desc);
            case "echeance" -> comparingNullable(
                    ChantierPortefeuilleRowDto::getJoursRestantsOuRetard,
                    Comparator.naturalOrder(), desc);
            case "marge" -> comparingNullable(
                    ChantierPortefeuilleRowDto::getMargeProjeteeHt,
                    Comparator.naturalOrder(), desc);
            case "avancement" -> comparingNullable(
                    ChantierPortefeuilleRowDto::getAvancementPercent,
                    Comparator.naturalOrder(), desc);
            default -> comparingNullable(
                    ChantierPortefeuilleRowDto::getCode,
                    Comparator.naturalOrder(), desc);
        };
        return principal
                .thenComparing(ChantierPortefeuilleRowDto::getCode)
                .thenComparing(ChantierPortefeuilleRowDto::getId);
    }

    private static <T, U> Comparator<T> comparingNullable(
            java.util.function.Function<T, U> cle, Comparator<U> ordre, boolean desc) {
        Comparator<U> ordreValeur = desc ? ordre.reversed() : ordre;
        return Comparator.comparing(cle, Comparator.nullsLast(ordreValeur));
    }

    private static int severiteRang(String severite) {
        return switch (severite) {
            case "CRITICAL" -> 0;
            case "WARNING" -> 1;
            default -> 2;
        };
    }
}
