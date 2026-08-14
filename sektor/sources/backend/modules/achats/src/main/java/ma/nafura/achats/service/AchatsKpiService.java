package ma.nafura.achats.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import ma.nafura.achats.api.dto.AchatsKpiDto;
import ma.nafura.achats.domain.model.BonCommandeAchat;
import ma.nafura.achats.domain.model.FactureFournisseur;
import ma.nafura.achats.repository.BonCommandeAchatRepository;
import ma.nafura.achats.repository.FactureFournisseurRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AchatsKpiService {

    private static final List<String> BC_EN_COURS = List.of(
            BonCommandeAchat.STATUS_VALIDE,
            BonCommandeAchat.STATUS_ENVOYE,
            BonCommandeAchat.STATUS_ACCUSE_RECEPTION,
            BonCommandeAchat.STATUS_PARTIELLEMENT_LIVRE,
            BonCommandeAchat.STATUS_LIVRE);

    private final BonCommandeAchatRepository bcRepository;
    private final BonCommandeAchatSeedService bcSeedService;
    private final FactureFournisseurRepository factureRepository;

    public AchatsKpiService(
            BonCommandeAchatRepository bcRepository,
            BonCommandeAchatSeedService bcSeedService,
            FactureFournisseurRepository factureRepository) {
        this.bcRepository = bcRepository;
        this.bcSeedService = bcSeedService;
        this.factureRepository = factureRepository;
    }

    @Transactional(readOnly = true)
    public AchatsKpiDto compute(LocalDate from, LocalDate to) {
        bcSeedService.seedIfEmpty();
        LocalDate ytdStart = LocalDate.of(LocalDate.now().getYear(), 1, 1);
        LocalDate periodStart = from != null ? from : ytdStart;
        LocalDate periodEnd = to != null ? to : LocalDate.now();
        if (periodStart.isAfter(periodEnd)) {
            throw new IllegalArgumentException("from must be on or before to");
        }

        UUID tenantId = TenantContext.getTenantId();
        List<BonCommandeAchat> bons = bcRepository.findByTenantIdOrderByCreatedAtDesc(tenantId);
        List<FactureFournisseur> factures = factureRepository.findByTenantIdOrderByCreatedAtDesc(tenantId);

        int nbBcEnCours = (int) bons.stream().filter(bc -> BC_EN_COURS.contains(bc.getStatus())).count();

        BigDecimal volumeAchatsYTD = factures.stream()
                .filter(f -> !FactureFournisseur.STATUS_BROUILLON.equals(f.getStatus())
                        && !FactureFournisseur.STATUS_ANNULEE.equals(f.getStatus()))
                .filter(f -> f.getDateFacture() != null
                        && !f.getDateFacture().isBefore(ytdStart)
                        && !f.getDateFacture().isAfter(periodEnd))
                .map(f -> f.getTotalHt() != null ? f.getTotalHt() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        if (volumeAchatsYTD.signum() == 0) {
            volumeAchatsYTD = bons.stream()
                    .filter(bc -> bc.getDateCreation() != null
                            && !bc.getDateCreation().isBefore(ytdStart)
                            && !bc.getDateCreation().isAfter(periodEnd))
                    .filter(bc -> !BonCommandeAchat.STATUS_BROUILLON.equals(bc.getStatus())
                            && !BonCommandeAchat.STATUS_ANNULE.equals(bc.getStatus()))
                    .map(bc -> bc.getTotalHt() != null ? bc.getTotalHt() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
        }

        Map<String, BigDecimal> byFournisseur = new HashMap<>();
        for (FactureFournisseur f : factures) {
            if (f.getDateFacture() == null
                    || f.getDateFacture().isBefore(periodStart)
                    || f.getDateFacture().isAfter(periodEnd)) {
                continue;
            }
            if (FactureFournisseur.STATUS_BROUILLON.equals(f.getStatus())
                    || FactureFournisseur.STATUS_ANNULEE.equals(f.getStatus())) {
                continue;
            }
            String key = f.getFournisseurId() != null ? f.getFournisseurId() : "unknown";
            BigDecimal ht = f.getTotalHt() != null ? f.getTotalHt() : BigDecimal.ZERO;
            byFournisseur.merge(key, ht, BigDecimal::add);
        }
        BigDecimal totalPeriod = byFournisseur.values().stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal top3 = byFournisseur.values().stream()
                .sorted(Comparator.reverseOrder())
                .limit(3)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        double dependanceTop3 = totalPeriod.signum() > 0
                ? top3.multiply(BigDecimal.valueOf(100))
                        .divide(totalPeriod, 2, RoundingMode.HALF_UP)
                        .doubleValue()
                : 0.0;

        return AchatsKpiDto.builder()
                .volumeAchatsYTD(scale2(volumeAchatsYTD))
                .nbBcEnCours(nbBcEnCours)
                .dependanceTop3(dependanceTop3)
                .economiesYTD(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP))
                .build();
    }

    private static BigDecimal scale2(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }
}
