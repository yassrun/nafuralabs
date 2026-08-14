package ma.nafura.chantiers.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import ma.nafura.achats.domain.model.FactureFournisseur;
import ma.nafura.achats.repository.FactureFournisseurRepository;
import ma.nafura.chantiers.api.dto.CashFlowProjectionMoisDto;
import ma.nafura.chantiers.domain.model.Chantier;
import ma.nafura.chantiers.domain.model.SituationTravaux;
import ma.nafura.chantiers.repository.ChantierRepository;
import ma.nafura.chantiers.repository.SituationTravauxRepository;
import ma.nafura.marches.domain.model.FactureMarche;
import ma.nafura.marches.repository.FactureMarcheRepository;
import ma.nafura.marches.service.FactureMarcheSeedService;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.rh.domain.model.FichePaie;
import ma.nafura.rh.repository.FichePaieRepository;
import ma.nafura.rh.service.FichePaieSeedService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class CashFlowProjectionService {

    private static final BigDecimal SOLDE_INITIAL = new BigDecimal("8500000");
    private static final BigDecimal TRAITES_BASE = new BigDecimal("220000");

    private final FactureMarcheRepository factureMarcheRepository;
    private final FactureMarcheSeedService factureMarcheSeedService;
    private final FactureFournisseurRepository factureFournisseurRepository;
    private final SituationTravauxRepository situationRepository;
    private final ChantierRepository chantierRepository;
    private final ChantierSeedService chantierSeedService;
    private final FichePaieRepository fichePaieRepository;
    private final FichePaieSeedService fichePaieSeedService;

    public CashFlowProjectionService(
            FactureMarcheRepository factureMarcheRepository,
            FactureMarcheSeedService factureMarcheSeedService,
            FactureFournisseurRepository factureFournisseurRepository,
            SituationTravauxRepository situationRepository,
            ChantierRepository chantierRepository,
            ChantierSeedService chantierSeedService,
            FichePaieRepository fichePaieRepository,
            FichePaieSeedService fichePaieSeedService) {
        this.factureMarcheRepository = factureMarcheRepository;
        this.factureMarcheSeedService = factureMarcheSeedService;
        this.factureFournisseurRepository = factureFournisseurRepository;
        this.situationRepository = situationRepository;
        this.chantierRepository = chantierRepository;
        this.chantierSeedService = chantierSeedService;
        this.fichePaieRepository = fichePaieRepository;
        this.fichePaieSeedService = fichePaieSeedService;
    }

    @Transactional(readOnly = true)
    public List<CashFlowProjectionMoisDto> project(YearMonth from, YearMonth to, String societeId) {
        factureMarcheSeedService.seedIfEmpty();
        chantierSeedService.seedIfEmpty();
        fichePaieSeedService.seedIfEmpty();

        if (from == null || to == null) {
            throw new IllegalArgumentException("from and to are required (yyyy-MM)");
        }
        if (from.isAfter(to)) {
            throw new IllegalArgumentException("from must be on or before to");
        }

        UUID tenantId = TenantContext.getTenantId();
        List<FactureMarche> facturesMarche =
                factureMarcheRepository.findByTenantIdOrderByDateEmissionDescCreatedAtDesc(tenantId);
        List<FactureFournisseur> facturesFourn =
                factureFournisseurRepository.findByTenantIdOrderByCreatedAtDesc(tenantId);
        List<SituationTravaux> situations = situationRepository.findByTenantId(tenantId);
        List<Chantier> chantiers = chantierRepository.findByTenantIdOrderByCodeAsc(tenantId);
        List<FichePaie> fiches = fichePaieRepository.findByTenantIdOrderByMoisDescNumeroDesc(tenantId);

        if (StringUtils.hasText(societeId)) {
            String sid = societeId.trim();
            chantiers = chantiers.stream().filter(c -> sid.equals(resolveSocieteId(c))).toList();
        }

        BigDecimal payrollBase = estimatePayrollNet(fiches);
        BigDecimal chargesBase = estimateCharges(fiches);

        List<CashFlowProjectionMoisDto> rows = new ArrayList<>();
        BigDecimal solde = SOLDE_INITIAL;
        int monthIndex = 0;
        final List<Chantier> scopedChantiers = chantiers;

        for (YearMonth cursor = from; !cursor.isAfter(to); cursor = cursor.plusMonths(1)) {
            final YearMonth month = cursor;
            final int idx = monthIndex;
            String mois = month.toString();
            BigDecimal soldeOuverture = solde;

            BigDecimal encFactures = facturesMarche.stream()
                    .filter(f -> matchesMonth(f.getDateEcheance(), month))
                    .filter(f -> !FactureMarche.STATUS_PAYEE.equals(f.getStatus()))
                    .filter(f -> !FactureMarche.STATUS_ANNULEE.equals(f.getStatus()))
                    .map(f -> f.getNetAPayer() != null ? f.getNetAPayer() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal encSituations = situations.stream()
                    .filter(s -> matchesMonth(s.getDateEmission(), month))
                    .filter(s -> !SituationTravaux.STATUS_BROUILLON.equals(s.getStatus()))
                    .filter(s -> !SituationTravaux.STATUS_PAYEE.equals(s.getStatus()))
                    .filter(s -> chantierInScope(scopedChantiers, s.getChantierId()))
                    .map(s -> s.getNetAPayerTtc() != null ? s.getNetAPayerTtc() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            double phase = 1.0 + 0.04 * Math.sin(idx / 2.0);
            BigDecimal encChantiers = scopedChantiers.stream()
                    .filter(c -> Chantier.STATUS_EN_COURS.equals(c.getStatus()))
                    .map(c -> {
                        BigDecimal budget = c.getMontantHt() != null ? c.getMontantHt() : BigDecimal.ZERO;
                        BigDecimal av = c.getAvancementPercent() != null ? c.getAvancementPercent() : BigDecimal.ZERO;
                        return budget.multiply(av)
                                .divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP)
                                .multiply(BigDecimal.valueOf(0.008 * phase * (1 + (idx % 3) * 0.03)));
                    })
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal encaissements = scale0(encFactures.add(encSituations).add(encChantiers));

            BigDecimal decFf = facturesFourn.stream()
                    .filter(f -> f.getResteARegler() != null && f.getResteARegler().signum() > 0)
                    .filter(f -> !FactureFournisseur.STATUS_BROUILLON.equals(f.getStatus()))
                    .filter(f -> !FactureFournisseur.STATUS_ANNULEE.equals(f.getStatus()))
                    .filter(f -> matchesMonth(f.getDateEcheance(), month))
                    .map(FactureFournisseur::getResteARegler)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal decPaie = scale0(payrollBase.add(BigDecimal.valueOf(18_000 * Math.sin(idx + 1))));
            BigDecimal decSoc = scale0(chargesBase.multiply(
                    BigDecimal.ONE.add(BigDecimal.valueOf(0.05 * ((idx + 2) % 4)))));
            BigDecimal decTrait = scale0(TRAITES_BASE
                    .multiply(BigDecimal.ONE.add(BigDecimal.valueOf(0.35 * (idx % 5))))
                    .add(BigDecimal.valueOf(40_000L * (idx % 2))));

            BigDecimal decaissements = scale0(decFf.add(decPaie).add(decSoc).add(decTrait));
            BigDecimal soldeCloture = scale0(soldeOuverture.add(encaissements).subtract(decaissements));
            solde = soldeCloture;

            rows.add(CashFlowProjectionMoisDto.builder()
                    .mois(mois)
                    .soldeOuverture(soldeOuverture)
                    .encaissements(encaissements)
                    .decaissements(decaissements)
                    .soldeCloture(soldeCloture)
                    .build());
            monthIndex++;
        }

        return rows;
    }

    private static boolean chantierInScope(List<Chantier> scoped, String chantierId) {
        if (scoped.isEmpty()) {
            return true;
        }
        return scoped.stream().anyMatch(c -> c.getId().equals(chantierId));
    }

    private static String resolveSocieteId(Chantier c) {
        if (StringUtils.hasText(c.getSocieteId())) {
            return c.getSocieteId();
        }
        return switch (c.getId()) {
            case "ch-001", "ch-003", "ch-005" -> "SocA";
            case "ch-002", "ch-004" -> "SocB";
            default -> "SocA";
        };
    }

    private static boolean matchesMonth(LocalDate date, YearMonth month) {
        return date != null && YearMonth.from(date).equals(month);
    }

    private static BigDecimal estimatePayrollNet(List<FichePaie> fiches) {
        List<FichePaie> recent = fiches.stream().filter(f -> f.getMois() != null && f.getMois().startsWith("2026")).toList();
        if (recent.isEmpty()) {
            return new BigDecimal("520000");
        }
        BigDecimal sum = recent.stream()
                .map(f -> f.getSalaireNetAPayer() != null ? f.getSalaireNetAPayer() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        long months = recent.stream().map(FichePaie::getMois).distinct().count();
        return scale0(sum.divide(BigDecimal.valueOf(Math.max(1, months)), 4, RoundingMode.HALF_UP));
    }

    private static BigDecimal estimateCharges(List<FichePaie> fiches) {
        List<FichePaie> recent = fiches.stream().filter(f -> f.getMois() != null && f.getMois().startsWith("2026")).toList();
        if (recent.isEmpty()) {
            return new BigDecimal("380000");
        }
        BigDecimal sumBrut = recent.stream()
                .map(f -> f.getSalaireBrut() != null ? f.getSalaireBrut() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal sumNet = recent.stream()
                .map(f -> f.getSalaireNetAPayer() != null ? f.getSalaireNetAPayer() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        long months = recent.stream().map(FichePaie::getMois).distinct().count();
        BigDecimal delta = sumBrut.subtract(sumNet).divide(BigDecimal.valueOf(Math.max(1, months)), 4, RoundingMode.HALF_UP);
        return scale0(delta.multiply(new BigDecimal("2.2")).max(new BigDecimal("320000")));
    }

    private static BigDecimal scale0(BigDecimal v) {
        return v.setScale(0, RoundingMode.HALF_UP);
    }
}
