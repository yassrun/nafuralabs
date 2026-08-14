package ma.nafura.chantiers.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import ma.nafura.chantiers.domain.model.AvancementPhysique;
import ma.nafura.chantiers.domain.model.Chantier;
import ma.nafura.chantiers.domain.model.ChantierLot;
import ma.nafura.chantiers.domain.model.SituationLigne;
import ma.nafura.chantiers.domain.model.SituationTravaux;
import ma.nafura.chantiers.repository.AvancementPhysiqueRepository;
import ma.nafura.chantiers.repository.ChantierLotRepository;
import ma.nafura.chantiers.repository.SituationLigneRepository;
import ma.nafura.chantiers.repository.SituationTravauxRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class SituationGenerationService {

    private static final BigDecimal ONE_HUNDRED = new BigDecimal("100");

    private final SituationTravauxRepository situationRepository;
    private final SituationLigneRepository ligneRepository;
    private final AvancementPhysiqueRepository avancementRepository;
    private final ChantierLotRepository lotRepository;
    private final ChantierService chantierService;

    public SituationGenerationService(
            SituationTravauxRepository situationRepository,
            SituationLigneRepository ligneRepository,
            AvancementPhysiqueRepository avancementRepository,
            ChantierLotRepository lotRepository,
            ChantierService chantierService) {
        this.situationRepository = situationRepository;
        this.ligneRepository = ligneRepository;
        this.avancementRepository = avancementRepository;
        this.lotRepository = lotRepository;
        this.chantierService = chantierService;
    }

    @Transactional
    public SituationTravaux generate(String chantierId, int numeroOrdre) {
        if (numeroOrdre < 1) {
            throw new IllegalArgumentException("numero must be >= 1");
        }

        Chantier chantier = chantierService.getById(chantierId);
        UUID tenantId = tenantId();

        situationRepository
                .findByTenantIdAndChantierIdAndNumeroOrdre(tenantId, chantierId, numeroOrdre)
                .ifPresent(existing -> {
                    throw new IllegalStateException(
                            "Situation numero " + numeroOrdre + " already exists for chantier " + chantierId);
                });

        List<ChantierLot> lots =
                lotRepository.findByTenantIdAndChantierIdOrderByOrdreAscCodeAsc(tenantId, chantierId);
        if (lots.isEmpty()) {
            throw new IllegalStateException("No lots found for chantier " + chantierId);
        }

        Map<String, BigDecimal> cumulByLot = computeValidatedCumuls(tenantId, chantierId);
        Map<String, BigDecimal> previousQuantiteByLot = loadPreviousQuantites(tenantId, chantierId, numeroOrdre);

        List<SituationLigne> lignes = new ArrayList<>();
        BigDecimal cumulCourantHt = BigDecimal.ZERO;
        int ordre = 1;
        for (ChantierLot lot : lots) {
            BigDecimal quantiteCumulee = cumulByLot.getOrDefault(lot.getId(), BigDecimal.ZERO);
            BigDecimal quantitePrecedente = previousQuantiteByLot.getOrDefault(lot.getId(), BigDecimal.ZERO);
            BigDecimal prixUnitaire = lot.getPrixUnitaireHt() != null ? lot.getPrixUnitaireHt() : BigDecimal.ZERO;
            BigDecimal montantHt = quantiteCumulee.multiply(prixUnitaire).setScale(2, RoundingMode.HALF_UP);
            cumulCourantHt = cumulCourantHt.add(montantHt);

            lignes.add(SituationLigne.builder()
                    .id(buildLigneId(chantierId, numeroOrdre, ordre))
                    .tenantId(tenantId)
                    .lotId(lot.getId())
                    .designation(lot.getDesignation())
                    .unite(lot.getUnite())
                    .quantiteTotale(lot.getQuantite())
                    .quantitePrecedente(quantitePrecedente)
                    .quantiteCumulee(quantiteCumulee)
                    .prixUnitaire(prixUnitaire)
                    .montantHt(montantHt)
                    .ordre(ordre++)
                    .build());
        }

        BigDecimal cumulPrecedentHt = loadPreviousCumulCourant(tenantId, chantierId, numeroOrdre);
        cumulCourantHt = cumulCourantHt.setScale(2, RoundingMode.HALF_UP);

        BigDecimal retenueGarantiePercent = chantier.getTauxRg() != null ? chantier.getTauxRg() : new BigDecimal("7");
        BigDecimal retenueAvancePercent = resolveRetenueAvancePercent(chantier);
        FinancialTotals totals = computeFinancialTotals(
                cumulCourantHt, cumulPrecedentHt, retenueGarantiePercent, retenueAvancePercent, chantier.getTauxTva());

        LocalDate periodEnd = resolvePeriodEnd(tenantId, chantierId);
        LocalDate periodStart = periodEnd.withDayOfMonth(1);

        String situationId = buildSituationId(chantierId, numeroOrdre);
        SituationTravaux situation = SituationTravaux.builder()
                .id(situationId)
                .tenantId(tenantId)
                .chantierId(chantierId)
                .numero(buildNumero(chantier.getCode(), numeroOrdre))
                .numeroOrdre(numeroOrdre)
                .datePeriodeDebut(periodStart)
                .datePeriodeFin(periodEnd)
                .dateEmission(LocalDate.now())
                .cumulPrecedentHt(cumulPrecedentHt)
                .cumulCourantHt(cumulCourantHt)
                .travauxPeriodeHt(totals.travauxPeriodeHt())
                .retenueGarantiePercent(retenueGarantiePercent)
                .retenueGarantieMontant(totals.retenueGarantieMontant())
                .retenueAvancePercent(retenueAvancePercent)
                .retenueAvanceMontant(totals.retenueAvanceMontant())
                .netAPayerHt(totals.netAPayerHt())
                .tvaTaux(chantier.getTauxTva())
                .netAPayerTtc(totals.netAPayerTtc())
                .status(SituationTravaux.STATUS_BROUILLON)
                .build();

        situationRepository.save(situation);
        for (SituationLigne ligne : lignes) {
            ligne.setSituationId(situation.getId());
            ligneRepository.save(ligne);
        }
        return situation;
    }

    Map<String, BigDecimal> computeValidatedCumuls(UUID tenantId, String chantierId) {
        List<AvancementPhysique> validated = avancementRepository
                .findByTenantIdAndChantierIdAndStatusOrderByDateSaisieAscCreatedAtAsc(
                        tenantId, chantierId, AvancementPhysique.STATUS_VALIDE);

        Map<String, BigDecimal> cumulByLot = new HashMap<>();
        for (AvancementPhysique row : validated) {
            if (!StringUtils.hasText(row.getLotId())) {
                continue;
            }
            cumulByLot.merge(row.getLotId(), row.getQuantiteRealisee(), BigDecimal::add);
        }
        return cumulByLot;
    }

    private Map<String, BigDecimal> loadPreviousQuantites(UUID tenantId, String chantierId, int numeroOrdre) {
        if (numeroOrdre <= 1) {
            return Map.of();
        }
        return situationRepository
                .findByTenantIdAndChantierIdAndNumeroOrdre(tenantId, chantierId, numeroOrdre - 1)
                .map(previous -> {
                    Map<String, BigDecimal> quantities = new HashMap<>();
                    for (SituationLigne ligne :
                            ligneRepository.findByTenantIdAndSituationIdOrderByOrdreAsc(tenantId, previous.getId())) {
                        if (StringUtils.hasText(ligne.getLotId())) {
                            quantities.put(ligne.getLotId(), ligne.getQuantiteCumulee());
                        }
                    }
                    return quantities;
                })
                .orElse(Map.of());
    }

    private BigDecimal loadPreviousCumulCourant(UUID tenantId, String chantierId, int numeroOrdre) {
        if (numeroOrdre <= 1) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        return situationRepository
                .findByTenantIdAndChantierIdAndNumeroOrdre(tenantId, chantierId, numeroOrdre - 1)
                .map(SituationTravaux::getCumulCourantHt)
                .orElse(BigDecimal.ZERO)
                .setScale(2, RoundingMode.HALF_UP);
    }

    private LocalDate resolvePeriodEnd(UUID tenantId, String chantierId) {
        return avancementRepository
                .findByTenantIdAndChantierIdAndStatusOrderByDateSaisieAscCreatedAtAsc(
                        tenantId, chantierId, AvancementPhysique.STATUS_VALIDE)
                .stream()
                .map(AvancementPhysique::getDateSaisie)
                .max(LocalDate::compareTo)
                .orElse(LocalDate.now());
    }

    static FinancialTotals computeFinancialTotals(
            BigDecimal cumulCourantHt,
            BigDecimal cumulPrecedentHt,
            BigDecimal retenueGarantiePercent,
            BigDecimal retenueAvancePercent,
            BigDecimal tvaTaux) {
        BigDecimal travauxPeriodeHt =
                cumulCourantHt.subtract(cumulPrecedentHt).setScale(2, RoundingMode.HALF_UP);
        BigDecimal retenueGarantieMontant = percentOf(travauxPeriodeHt, retenueGarantiePercent);
        BigDecimal retenueAvanceMontant = retenueAvancePercent != null
                ? percentOf(travauxPeriodeHt, retenueAvancePercent)
                : BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        BigDecimal netAPayerHt = travauxPeriodeHt
                .subtract(retenueGarantieMontant)
                .subtract(retenueAvanceMontant)
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal effectiveTva = tvaTaux != null ? tvaTaux : new BigDecimal("20");
        BigDecimal netAPayerTtc = netAPayerHt
                .multiply(BigDecimal.ONE.add(effectiveTva.divide(ONE_HUNDRED, 6, RoundingMode.HALF_UP)))
                .setScale(2, RoundingMode.HALF_UP);
        return new FinancialTotals(
                travauxPeriodeHt, retenueGarantieMontant, retenueAvanceMontant, netAPayerHt, netAPayerTtc);
    }

    private static BigDecimal percentOf(BigDecimal base, BigDecimal percent) {
        if (percent == null || percent.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        return base.multiply(percent)
                .divide(ONE_HUNDRED, 6, RoundingMode.HALF_UP)
                .setScale(2, RoundingMode.HALF_UP);
    }

    private static BigDecimal resolveRetenueAvancePercent(Chantier chantier) {
        if (chantier.getTauxAvance() != null && chantier.getTauxAvance().compareTo(BigDecimal.ZERO) > 0) {
            return new BigDecimal("5");
        }
        return null;
    }

    static String buildNumero(String chantierCode, int numeroOrdre) {
        String suffix = chantierCode != null ? chantierCode.replace("CH-", "") : "000";
        return "SIT-" + suffix + "-" + String.format("%02d", numeroOrdre);
    }

    private static String buildSituationId(String chantierId, int numeroOrdre) {
        return chantierId + "-sit-" + String.format("%02d", numeroOrdre);
    }

    private static String buildLigneId(String chantierId, int numeroOrdre, int ordre) {
        return chantierId + "-sit-" + String.format("%02d", numeroOrdre) + "-lig-" + ordre;
    }

    private static UUID tenantId() {
        return TenantContext.getTenantId();
    }

    record FinancialTotals(
            BigDecimal travauxPeriodeHt,
            BigDecimal retenueGarantieMontant,
            BigDecimal retenueAvanceMontant,
            BigDecimal netAPayerHt,
            BigDecimal netAPayerTtc) {}
}
