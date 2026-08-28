package ma.nafura.chantiers.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.function.Supplier;
import ma.nafura.chantiers.api.dto.ChantierAffectationDto;
import ma.nafura.chantiers.api.dto.ChantierSummaryDto;
import ma.nafura.chantiers.api.dto.CockpitChantierDto;
import ma.nafura.chantiers.domain.chantier.Chantier;
import ma.nafura.chantiers.domain.chantier.JournalChantier;
import ma.nafura.chantiers.repository.ChantierLotRepository;
import ma.nafura.chantiers.repository.AttachementChantierRepository;
import ma.nafura.chantiers.repository.AvancementPhysiqueRepository;
import ma.nafura.chantiers.repository.JournalChantierRepository;
import ma.nafura.chantiers.service.port.DemandeAchatCockpitPort;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Read model cockpit (cockpit-chantier AC-1 à AC-13, AC-22).
 *
 * <p>Compose, à la lecture et sans rien stocker : identité, calendrier, finance (dictionnaire
 * canonique du contrat continuite), avancement, checklist de préparation (AC-5), alertes
 * déterministes (AC-9/AC-12/AC-13) et prochaines actions (AC-10/AC-11). L'ordre et les seuils
 * vivent ici, jamais dans le frontend. Une valeur non calculable est {@code NOT_AVAILABLE} avec
 * sa cause ; une donnée financière interdite au rôle est {@code FORBIDDEN}, jamais zéro.
 */
@Service
public class CockpitChantierService {

    private static final int MONEY_SCALE = 2;
    private static final String MAD = "MAD";
    private static final String HT = "HT";
    private static final String TTC = "TTC";
    private static final String AVAILABLE = "AVAILABLE";
    private static final String NOT_AVAILABLE = "NOT_AVAILABLE";
    private static final String FORBIDDEN = "FORBIDDEN";

    private final ChantierService chantierService;
    private final ChantierSummaryReadService summaryService;
    private final ChantierAffectationService affectationService;
    private final ChantierLotRepository lotRepository;
    private final JournalChantierRepository journalRepository;
    private final AttachementChantierRepository attachementRepository;
    private final AvancementPhysiqueRepository avancementRepository;
    private final ObjectProvider<DemandeAchatCockpitPort> demandeAchatPort;

    public CockpitChantierService(
            ChantierService chantierService,
            ChantierSummaryReadService summaryService,
            ChantierAffectationService affectationService,
            ChantierLotRepository lotRepository,
            JournalChantierRepository journalRepository,
            AttachementChantierRepository attachementRepository,
            AvancementPhysiqueRepository avancementRepository,
            ObjectProvider<DemandeAchatCockpitPort> demandeAchatPort) {
        this.chantierService = chantierService;
        this.summaryService = summaryService;
        this.affectationService = affectationService;
        this.lotRepository = lotRepository;
        this.journalRepository = journalRepository;
        this.attachementRepository = attachementRepository;
        this.avancementRepository = avancementRepository;
        this.demandeAchatPort = demandeAchatPort;
    }

    @Transactional(readOnly = true)
    public CockpitChantierDto lireCockpit(String chantierId) {
        // AC-22 — l'identité fait foi : son échec (introuvable/interdit) est une erreur globale.
        Chantier chantier = chantierService.getById(chantierId);
        OffsetDateTime fraicheur = chantier.getUpdatedAt(); // P1-11 : vraie fraîcheur, jamais now()

        List<CockpitChantierDto.DegradationDto> degradations = new ArrayList<>();
        ChantierSummaryDto summary = lireSansPlanter(
                () -> summaryService.getSummary(chantierId),
                "chantiers.cockpit.degradation.synthese", degradations);
        List<ChantierAffectationDto> affectations = lireSansPlanter(
                () -> affectationService.listByChantier(chantierId),
                "chantiers.cockpit.degradation.equipe", degradations, List.of());
        Long nbLots = lireSansPlanter(
                () -> lotRepository.countByTenantIdAndChantierId(tenantId(), chantierId),
                "chantiers.cockpit.degradation.arbre", degradations);
        Boolean aAttachementPeriode = lireSansPlanter(
                () -> aAttachementPeriode(chantierId),
                "chantiers.cockpit.degradation.attachements", degradations);
        Boolean aAvancementPeriode = lireSansPlanter(
                () -> aAvancementPeriode(chantierId),
                "chantiers.cockpit.degradation.avancements", degradations);

        boolean aConducteur = affectations.stream()
                .anyMatch(a -> "BTP_CONDUCTEUR_TRAVAUX".equals(a.getRoleCode()));
        boolean aChefChantier = affectations.stream()
                .anyMatch(a -> "BTP_CHEF_CHANTIER".equals(a.getRoleCode()));

        return CockpitChantierDto.builder()
                .identity(identite(chantier, fraicheur))
                .schedule(calendrier(chantier))
                .finance(lireSansPlanter(
                        () -> finance(summary, chantier, fraicheur),
                        "chantiers.cockpit.degradation.finance", degradations,
                        financeIndisponible(fraicheur)))
                .progress(lireSansPlanter(
                        () -> progression(chantier, summary, fraicheur,
                                aAvancementPeriode, aAttachementPeriode),
                        "chantiers.cockpit.degradation.progression", degradations,
                        progressionIndisponible(fraicheur)))
                .preparation(preparation(chantier, nbLots, aConducteur, aChefChantier, degradations))
                .alerts(alertes(chantier, summary, degradations))
                .nextActions(ChantierActionDecision.actions(
                        chantier, nbLots != null ? nbLots : 0, aConducteur, aChefChantier))
                .activityFeed(lireSansPlanter(
                        () -> activite(chantierId),
                        "chantiers.cockpit.degradation.activite", degradations, List.of()))
                .ops(ops(chantier, degradations))
                .degradations(degradations)
                .build();
    }

    /** P1-13 — une source non identitaire peut tomber sans faire tomber le cockpit. */
    private static <T> T lireSansPlanter(
            Supplier<T> lecture, String cause, List<CockpitChantierDto.DegradationDto> degradations) {
        return lireSansPlanter(lecture, cause, degradations, null);
    }

    private static <T> T lireSansPlanter(
            Supplier<T> lecture, String cause, List<CockpitChantierDto.DegradationDto> degradations,
            T fallback) {
        try {
            return lecture.get();
        } catch (RuntimeException ex) {
            degradations.add(CockpitChantierDto.DegradationDto.builder()
                    .section(cause).cause(ex.getMessage() != null ? ex.getMessage() : cause).build());
            return fallback;
        }
    }

    private static CockpitChantierDto.FinanceDto financeIndisponible(OffsetDateTime fraicheur) {
        CockpitChantierDto.MontantDto indispo = CockpitChantierDto.MontantDto.builder()
                .etat(NOT_AVAILABLE).cause("chantiers.cockpit.finance.indisponible")
                .fraicheur(fraicheur).build();
        return CockpitChantierDto.FinanceDto.builder()
                .montantVenteActifHt(indispo).debourseInitialHt(indispo).budgetReviseHt(indispo)
                .margeProjeteeHt(indispo).margeProjeteePct(indispo).build();
    }

    private static CockpitChantierDto.ProgressDto progressionIndisponible(OffsetDateTime fraicheur) {
        CockpitChantierDto.MontantDto indispo = CockpitChantierDto.MontantDto.builder()
                .etat(NOT_AVAILABLE).cause("chantiers.cockpit.progress.indisponible")
                .fraicheur(fraicheur).build();
        return CockpitChantierDto.ProgressDto.builder()
                .avancementPercent(indispo)
                .factureHt(indispo).encaisseTtc(indispo)
                .fluxMois(CockpitChantierDto.FluxMensuelDto.builder()
                        .etape("INDISPONIBLE").periode(periodeCourante())
                        .actionnable(false).build())
                .build();
    }

    /** SEKTOR-227 — compteur DA pour tuile cockpit EN_COURS ; NOT_AVAILABLE si Achats down. */
    private CockpitChantierDto.OpsDto ops(
            Chantier chantier, List<CockpitChantierDto.DegradationDto> degradations) {
        if (!Chantier.STATUS_EN_COURS.equals(chantier.getStatus())) {
            return null;
        }
        CockpitChantierDto.CompteurDto demandes = lireSansPlanter(
                () -> compteurDemandesAchat(chantier.getId()),
                "chantiers.cockpit.degradation.demandesAchat", degradations,
                compteurIndisponible("chantiers.cockpit.ops.demandesAchat.indisponible"));
        return CockpitChantierDto.OpsDto.builder().demandesAchat(demandes).build();
    }

    private CockpitChantierDto.CompteurDto compteurDemandesAchat(String chantierId) {
        DemandeAchatCockpitPort port = demandeAchatPort.getIfAvailable();
        if (port == null) {
            throw new IllegalStateException("achats.cockpit.demandes_indisponibles");
        }
        long count = port.compterParChantier(chantierId);
        return CockpitChantierDto.CompteurDto.builder()
                .valeur(count).etat(AVAILABLE).build();
    }

    private static CockpitChantierDto.CompteurDto compteurIndisponible(String cause) {
        return CockpitChantierDto.CompteurDto.builder()
                .etat(NOT_AVAILABLE).cause(cause).build();
    }

    // ── Identité ──────────────────────────────────────────────────────────────

    private static CockpitChantierDto.IdentityDto identite(Chantier c, OffsetDateTime fraicheur) {
        return CockpitChantierDto.IdentityDto.builder()
                .chantierId(c.getId())
                .code(c.getCode())
                .nom(c.getLabel())
                .client(c.getClientName())
                .status(c.getStatus())
                .sourceVente(c.getSourceVente())
                .devisNumero(c.getDevisNumero())
                .fraicheur(fraicheur)
                .build();
    }

    // ── Calendrier (AC-13) ───────────────────────────────────────────────────

    private static CockpitChantierDto.ScheduleDto calendrier(Chantier c) {
        CockpitChantierDto.ScheduleDto.ScheduleDtoBuilder b = CockpitChantierDto.ScheduleDto.builder()
                .dateDemarrage(c.getDateDemarrage())
                .dateFinPrevue(c.getDateFinPrevue())
                .dateFinReelle(c.getDateFinReelle())
                .osReference(c.getOsReference())
                .osDateEffet(c.getOsDateEffet());
        LocalDate fin = c.getDateFinPrevue();
        if (fin == null) {
            return b.enRetard(false).joursRestantsOuRetard(null)
                    .absence("chantiers.cockpit.schedule.finPrevueAbsente").build();
        }
        LocalDate aujourdhui = LocalDate.now();
        long ecart = java.time.temporal.ChronoUnit.DAYS.between(aujourdhui, fin);
        if (ecart < 0) {
            return b.enRetard(true).joursRestantsOuRetard((int) -ecart).build();
        }
        return b.enRetard(false).joursRestantsOuRetard((int) ecart).build();
    }

    // ── Finance (AC-3, AC-4, AC-12) ───────────────────────────────────────────

    private CockpitChantierDto.FinanceDto finance(
            ChantierSummaryDto s, Chantier c, OffsetDateTime fraicheur) {
        boolean peutVoirFinance = peutVoirFinance();
        String venteSource = Chantier.SOURCE_MARCHE.equals(c.getSourceVente())
                ? Chantier.SOURCE_MARCHE
                : Chantier.SOURCE_DEVIS;
        CockpitChantierDto.MontantDto vente = montant(
                s.getMontantVenteActifHt(), MAD, HT, fraicheur, venteSource,
                peutVoirFinance, "chantiers.cockpit.finance.venteAbsente");
        CockpitChantierDto.MontantDto debourse = montant(
                s.getDebourseInitialHt(), MAD, HT, fraicheur, "SNAPSHOT",
                peutVoirFinance, "chantiers.cockpit.finance.debourseAbsent");
        CockpitChantierDto.MontantDto budget = montant(
                s.getBudgetReviseHt(), MAD, HT, fraicheur, "ARBRE",
                peutVoirFinance, "chantiers.cockpit.finance.budgetAbsent");
        CockpitChantierDto.MontantDto margeHt = montant(
                s.getMargeProjeteeHt(), MAD, HT, fraicheur, "VENTE-BUDGET",
                peutVoirFinance, "chantiers.cockpit.finance.margeIndisponible");
        CockpitChantierDto.MontantDto margePct = montant(
                s.getMargeProjeteePct(), "%", null, fraicheur, "VENTE-BUDGET",
                peutVoirFinance, "chantiers.cockpit.finance.margeIndisponible");
        return CockpitChantierDto.FinanceDto.builder()
                .montantVenteActifHt(vente)
                .debourseInitialHt(debourse)
                .budgetReviseHt(budget)
                .margeProjeteeHt(margeHt)
                .margeProjeteePct(margePct)
                .build();
    }

    private static CockpitChantierDto.MontantDto montant(
            BigDecimal valeur, String devise, String base, OffsetDateTime fraicheur,
            String source, boolean autorise, String causeAbsence) {
        if (!autorise) {
            return CockpitChantierDto.MontantDto.builder()
                    .etat(FORBIDDEN).cause("chantiers.cockpit.finance.accesRestreint").build();
        }
        if (valeur == null) {
            return CockpitChantierDto.MontantDto.builder()
                    .etat(NOT_AVAILABLE).cause(causeAbsence).build();
        }
        return CockpitChantierDto.MontantDto.builder()
                .montant(valeur.setScale(MONEY_SCALE, RoundingMode.HALF_UP))
                .devise(devise).base(base).fraicheur(fraicheur).source(source)
                .etat(AVAILABLE).build();
    }

    /** AC-20 — visibilité financière : règle unique partagée avec le portefeuille (P0-4). */
    private static boolean peutVoirFinance() {
        return ChantierFinanceAccess.peutVoirFinance();
    }

    // ── Progression (AC-15) ───────────────────────────────────────────────────

    private CockpitChantierDto.ProgressDto progression(
            Chantier c, ChantierSummaryDto s, OffsetDateTime fraicheur,
            Boolean aAvancementPeriode, Boolean aAttachementPeriode) {
        BigDecimal avancement = c.getAvancementPercent() != null
                ? c.getAvancementPercent().setScale(1, RoundingMode.HALF_UP)
                : null;
        CockpitChantierDto.MontantDto av = montant(
                avancement, "%", null, fraicheur, "ARBRE", true,
                "chantiers.cockpit.progress.avancementAbsent");
        // Facturé/encaissé : le chantier ne tient pas ces chiffres (AC-14) → NOT_AVAILABLE.
        CockpitChantierDto.MontantDto facture = CockpitChantierDto.MontantDto.builder()
                .etat(NOT_AVAILABLE).cause("chantiers.cockpit.progress.factureNonTenue")
                .fraicheur(fraicheur).build();
        CockpitChantierDto.MontantDto encaisse = CockpitChantierDto.MontantDto.builder()
                .etat(NOT_AVAILABLE).cause("chantiers.cockpit.progress.encaisseNonTenue")
                .fraicheur(fraicheur).build();
        // AC-15/P1-9 — le flux mensuel est calculé sur de vraies données : la première rupture
        // réelle de la séquence avancement → attachement → situation, jamais « AVANCEMENT » en dur.
        CockpitChantierDto.FluxMensuelDto flux = fluxMensuel(
                s, c, aAvancementPeriode, aAttachementPeriode);
        return CockpitChantierDto.ProgressDto.builder()
                .avancementPercent(av)
                .factureHt(facture)
                .encaisseTtc(encaisse)
                .fluxMois(flux)
                .build();
    }

    /**
     * AC-15/P1-9 — première rupture réelle du flux mensuel, calculée depuis les données
     * persistées (avancement présent ? situation ouverte ?) et actionnable vers le module qui
     * résout l'étape. {@code premiereAction} est une ROUTE réelle (jamais une clé de libellé) ;
     * {@code etape} est une clé de libellé consommée par l'UI.
     */
    private static CockpitChantierDto.FluxMensuelDto fluxMensuel(
            ChantierSummaryDto s, Chantier c,
            Boolean aAvancementPeriode, Boolean aAttachementPeriode) {
        String periode = periodeCourante();
        long situationsOuvertes = s.getOpenSituationsCount();
        if (estTerminal(c.getStatus())) {
            return CockpitChantierDto.FluxMensuelDto.builder()
                    .etape("chantiers.cockpit.flux.etapeLectureSeule").periode(periode)
                    .actionnable(false).build();
        }
        if (Chantier.STATUS_SUSPENDU.equals(c.getStatus())) {
            return CockpitChantierDto.FluxMensuelDto.builder()
                    .etape("chantiers.cockpit.flux.etapeSuspendu").periode(periode)
                    .premiereAction("/chantiers/{id}")
                    .actionnable(true).build();
        }
        if (Boolean.FALSE.equals(aAvancementPeriode)) {
            return CockpitChantierDto.FluxMensuelDto.builder()
                    .etape("chantiers.cockpit.flux.etapeAvancement").periode(periode)
                    .premiereAction("/chantiers/avancements/saisie/{id}")
                    .actionnable(true).build();
        }
        if (aAvancementPeriode == null) {
            return CockpitChantierDto.FluxMensuelDto.builder()
                    .etape("INDISPONIBLE").periode(periode).actionnable(false).build();
        }
        if (Boolean.FALSE.equals(aAttachementPeriode)) {
            return CockpitChantierDto.FluxMensuelDto.builder()
                    .etape("chantiers.cockpit.flux.etapeAttachement").periode(periode)
                    .premiereAction("/chantiers/attachements/saisie?chantierId={id}")
                    .actionnable(true).build();
        }
        if (aAttachementPeriode == null) {
            return CockpitChantierDto.FluxMensuelDto.builder()
                    .etape("INDISPONIBLE").periode(periode).actionnable(false).build();
        }
        if (situationsOuvertes == 0) {
            return CockpitChantierDto.FluxMensuelDto.builder()
                    .etape("chantiers.cockpit.flux.etapeSituation").periode(periode)
                    .premiereAction("/chantiers/situations?chantierId={id}")
                    .actionnable(true).build();
        }
        return CockpitChantierDto.FluxMensuelDto.builder()
                .etape("chantiers.cockpit.flux.etapeComplete").periode(periode)
                .actionnable(false).build();
    }

    private boolean aAttachementPeriode(String chantierId) {
        java.time.YearMonth mois = java.time.YearMonth.now();
        return !attachementRepository
                .findByTenantIdAndChantierIdAndDateDebutLessThanEqualAndDateFinGreaterThanEqual(
                        tenantId(), chantierId, mois.atEndOfMonth(), mois.atDay(1))
                .isEmpty();
    }

    private boolean aAvancementPeriode(String chantierId) {
        java.time.YearMonth mois = java.time.YearMonth.now();
        return !avancementRepository.findByTenantIdAndChantierIdAndDateSaisieBetween(
                tenantId(), chantierId, mois.atDay(1), mois.atEndOfMonth()).isEmpty();
    }

    private static boolean estTerminal(String status) {
        return Chantier.STATUS_RECEPTION_PROVISOIRE.equals(status)
                || Chantier.STATUS_RECEPTION_DEFINITIF.equals(status)
                || Chantier.STATUS_CLOS.equals(status);
    }

    private static String periodeCourante() {
        return java.time.YearMonth.now().toString();
    }

    // ── Préparation (AC-5) ────────────────────────────────────────────────────

    /**
     * AC-5 — la checklist est calculée depuis la règle unique de préparation
     * ({@link ChantierService#bloqueursDePreparation}) : la commande de démarrage et la
     * checklist ne peuvent pas se contredire (P1-5). En création directe, vente et budget
     * initiaux sont NON_APPLICABLE (AC-17) et ne bloquent pas.
     */
    private List<CockpitChantierDto.PreparationDto> preparation(
            Chantier c, Long nbLots, boolean aConducteur, boolean aChefChantier,
            List<CockpitChantierDto.DegradationDto> degradations) {
        List<CockpitChantierDto.PreparationDto> out = new ArrayList<>();
        // P1-5 — règle unique partagée avec la commande de démarrage (jamais de contradiction).
        List<String> bloquants = PreparationRegles.bloquants(
                c, nbLots != null ? nbLots : 0, aConducteur, aChefChantier);
        boolean equipeIndispo = degradations.stream()
                .anyMatch(d -> "chantiers.cockpit.degradation.equipe".equals(d.getSection()));

        out.add(prep("identite_client", bloquants.contains("identite_client"),
                "chantiers.cockpit.preparation.identite", "chantiers.cockpit.preparation.action.identite",
                "chantiers.cockpit.preparation.raison.identite"));
        out.add(prepNonApplicable(
                "reference_vente", bloquants.contains("reference_vente"),
                c.getSourceVente() == null,
                "chantiers.cockpit.preparation.vente", "chantiers.cockpit.preparation.action.vente",
                "chantiers.cockpit.preparation.raison.vente"));
        if (nbLots == null) {
            out.add(prepIndisponible("arbre",
                    "chantiers.cockpit.preparation.arbre", "chantiers.cockpit.preparation.action.arbre"));
        } else {
            out.add(prep("arbre", bloquants.contains("arbre"),
                    "chantiers.cockpit.preparation.arbre", "chantiers.cockpit.preparation.action.arbre",
                    "chantiers.cockpit.preparation.raison.arbre"));
        }
        // P1-5 — budget_initial : règle unique (BLOQUANT si déboursé initial absent), même en
        // création directe ; le cockpit et la commande de démarrage partagent ce code.
        out.add(prep("budget_initial", bloquants.contains("budget_initial"),
                "chantiers.cockpit.preparation.budget", "chantiers.cockpit.preparation.action.budget",
                "chantiers.cockpit.preparation.raison.budget"));
        if (equipeIndispo) {
            out.add(prepIndisponible("responsables",
                    "chantiers.cockpit.preparation.responsables",
                    "chantiers.cockpit.preparation.action.responsables"));
        } else {
            out.add(prep("responsables", bloquants.contains("responsables"),
                    "chantiers.cockpit.preparation.responsables",
                    "chantiers.cockpit.preparation.action.responsables",
                    "chantiers.cockpit.preparation.raison.responsables"));
        }
        out.add(prep("dates_prevues", bloquants.contains("dates_prevues"),
                "chantiers.cockpit.preparation.dates", "chantiers.cockpit.preparation.action.dates",
                "chantiers.cockpit.preparation.raison.dates"));
        // OS — posé au démarrage (SEKTOR-198) ; « hors OS » dans la règle de préparation, mais
        // l'item de checklist reflète l'état saisi (AC-5) : bloquant si absent.
        out.add(prep("ordre_service",
                c.getOsReference() == null || c.getOsDateEffet() == null,
                "chantiers.cockpit.preparation.os", "chantiers.cockpit.preparation.action.os",
                "chantiers.cockpit.preparation.raison.os"));
        // Planning — jamais bloquant (AC-8).
        out.add(CockpitChantierDto.PreparationDto.builder()
                .code("planning")
                .etat("A_FAIRE")
                .libelle("chantiers.cockpit.preparation.planning")
                .action("chantiers.cockpit.preparation.action.planning")
                .raison("chantiers.cockpit.preparation.raison.planning")
                .build());
        return out;
    }

    private static CockpitChantierDto.PreparationDto prep(
            String code, boolean bloquant, String libelle, String action, String raison) {
        return CockpitChantierDto.PreparationDto.builder()
                .code(code)
                .etat(bloquant ? "BLOQUANT" : "OK")
                .libelle(libelle).action(action).raison(raison).build();
    }

    private static CockpitChantierDto.PreparationDto prepNonApplicable(
            String code, boolean bloquant, boolean nonApplicable, String libelle, String action,
            String raison) {
        String etat = nonApplicable ? "NON_APPLICABLE" : (bloquant ? "BLOQUANT" : "OK");
        return CockpitChantierDto.PreparationDto.builder()
                .code(code).etat(etat).libelle(libelle).action(action).raison(raison).build();
    }

    private static CockpitChantierDto.PreparationDto prepIndisponible(
            String code, String libelle, String action) {
        return CockpitChantierDto.PreparationDto.builder()
                .code(code).etat("INDISPONIBLE").libelle(libelle).action(action)
                .raison("chantiers.cockpit.preparation.raison.indisponible").build();
    }

    // ── Alertes (AC-9, AC-12, AC-13) ──────────────────────────────────────────

    /**
     * Alerte de plus haute priorité d'un chantier — réutilisée par le portefeuille (AC-18) :
     * une seule règle, jamais dupliquée côté liste. Ordre déterministe (P1-12) : sévérité,
     * puis ancienneté (la plus ancienne d'abord), puis code (tie-breaker stable).
     */
    public static CockpitChantierDto.AlerteDto alertePrincipale(Chantier c, ChantierSummaryDto s) {
        List<CockpitChantierDto.AlerteDto> alertes = alertes(c, s, List.of());
        if (alertes.isEmpty()) {
            return null;
        }
        return alertes.get(0);
    }

    private static int severiteRang(String severite) {
        return switch (severite) {
            case "CRITICAL" -> 0;
            case "WARNING" -> 1;
            default -> 2;
        };
    }

    private static List<CockpitChantierDto.AlerteDto> alertes(
            Chantier c, ChantierSummaryDto s, List<CockpitChantierDto.DegradationDto> degradations) {
        List<CockpitChantierDto.AlerteDto> out = new ArrayList<>();
        // Dérive de marge : négative → CRITICAL ; baisse vs initiale → WARNING (AC-12).
        if (s != null && s.getMargeProjeteeHt() != null && s.getMargeProjeteeHt().signum() < 0) {
            out.add(CockpitChantierDto.AlerteDto.builder()
                    .code("marge_negative").severite("CRITICAL")
                    .faitSource("budget_arbre")
                    .dateFait(java.time.LocalDate.now())
                    .valeurObservee(s.getMargeProjeteeHt())
                    .regle("marge projetée < 0")
                    .sourceId(c.getId())
                    .message("chantiers.cockpit.alerte.margeNegative")
                    .action("chantiers.cockpit.alerte.action.budget")
                    .build());
        } else if (s != null && s.getMargeProjeteeHt() != null && s.getMargeInitialeHt() != null
                && s.getMargeProjeteeHt().compareTo(s.getMargeInitialeHt()) < 0) {
            out.add(CockpitChantierDto.AlerteDto.builder()
                    .code("marge_en_baisse").severite("WARNING")
                    .faitSource("budget_arbre")
                    .dateFait(java.time.LocalDate.now())
                    .valeurObservee(s.getMargeProjeteeHt())
                    .regle("marge projetée < marge initiale")
                    .sourceId(c.getId())
                    .message("chantiers.cockpit.alerte.margeBaisse")
                    .action("chantiers.cockpit.alerte.action.budget")
                    .build());
        }
        if (s != null && (s.getMontantVenteActifHt() == null || s.getBudgetReviseHt() == null)) {
            out.add(CockpitChantierDto.AlerteDto.builder()
                    .code("finance_incomplete").severite("WARNING")
                    .faitSource("snapshot")
                    .dateFait(java.time.LocalDate.now())
                    .valeurObservee(null)
                    .regle("vente active ou budget révisé absent")
                    .sourceId(c.getId())
                    .message("chantiers.cockpit.alerte.financeIncomplete")
                    .action("chantiers.cockpit.alerte.action.etude")
                    .build());
        }
        // Retard (AC-13) : seulement si les dates réelles existent.
        CockpitChantierDto.ScheduleDto sch = calendrier(c);
        if (sch.isEnRetard()) {
            out.add(CockpitChantierDto.AlerteDto.builder()
                    .code("retard_contractuel").severite("WARNING")
                    .faitSource("chantier.dates")
                    .dateFait(sch.getDateFinPrevue())
                    .valeurObservee(sch.getJoursRestantsOuRetard() != null
                            ? BigDecimal.valueOf(sch.getJoursRestantsOuRetard()) : null)
                    .regle("aujourd'hui > fin prévue")
                    .sourceId(c.getId())
                    .message("chantiers.cockpit.alerte.retard")
                    .action("chantiers.cockpit.alerte.action.planning")
                    .build());
        }
        for (CockpitChantierDto.DegradationDto d : degradations) {
            out.add(CockpitChantierDto.AlerteDto.builder()
                    .code("source_indisponible").severite("WARNING")
                    .faitSource(d.getSection())
                    .dateFait(java.time.LocalDate.now())
                    .regle("source secondaire en échec")
                    .sourceId(d.getSection())
                    .message("chantiers.cockpit.alerte.sourceIndisponible")
                    .action("chantiers.cockpit.alerte.action.reessayer")
                    .build());
        }
        // P1-12 — ordre contractuel déterministe : sévérité, ancienneté, code (tie-breaker).
        out.sort(Comparator
                .comparingInt((CockpitChantierDto.AlerteDto a) -> severiteRang(a.getSeverite()))
                .thenComparing(CockpitChantierDto.AlerteDto::getDateFait,
                        Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing(CockpitChantierDto.AlerteDto::getCode));
        return out;
    }

    // ── Activité récente (AC-9) ───────────────────────────────────────────────

    private List<CockpitChantierDto.ActivityFeedDto> activite(String chantierId) {
        List<JournalChantier> entries = journalRepository
                .findByTenantIdAndChantierIdOrderByDateDescCreatedAtDesc(tenantId(), chantierId);
        return entries.stream()
                .limit(10)
                .map(j -> CockpitChantierDto.ActivityFeedDto.builder()
                        .date(j.getCreatedAt()).type(j.getType())
                        .auteur(j.getAuteur()).contenu(j.getContenu()).build())
                .toList();
    }

    private static java.util.UUID tenantId() {
        return TenantContext.getTenantId();
    }
}
