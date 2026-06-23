package ma.nafura.chantiers.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import ma.nafura.chantiers.domain.model.AvancementPhysique;
import ma.nafura.chantiers.domain.model.Chantier;
import ma.nafura.chantiers.domain.model.ChantierLot;
import ma.nafura.chantiers.repository.AvancementPhysiqueRepository;
import ma.nafura.chantiers.repository.ChantierLotRepository;
import ma.nafura.chantiers.repository.ChantierRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * Propagates latest physical progress from avancement rows onto lots and chantier header.
 */
@Service
public class ChantierProgressSyncService {

    private final AvancementPhysiqueRepository avancementRepository;
    private final ChantierLotRepository lotRepository;
    private final ChantierRepository chantierRepository;

    public ChantierProgressSyncService(
            AvancementPhysiqueRepository avancementRepository,
            ChantierLotRepository lotRepository,
            ChantierRepository chantierRepository) {
        this.avancementRepository = avancementRepository;
        this.lotRepository = lotRepository;
        this.chantierRepository = chantierRepository;
    }

    @Transactional
    public void syncFromAvancements(String chantierId) {
        UUID tenantId = tenantId();
        Chantier chantier = chantierRepository
                .findByIdAndTenantId(chantierId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Chantier not found: " + chantierId));

        List<AvancementPhysique> rows =
                avancementRepository.findByTenantIdAndChantierIdOrderByDateSaisieDescCreatedAtDesc(
                        tenantId, chantierId);
        Map<String, AvancementPhysique> dernierByLot = new HashMap<>();
        for (AvancementPhysique row : rows) {
            if (StringUtils.hasText(row.getLotId())) {
                dernierByLot.putIfAbsent(row.getLotId(), row);
            }
        }

        List<ChantierLot> lots =
                lotRepository.findByTenantIdAndChantierIdOrderByOrdreAscCodeAsc(tenantId, chantierId);
        BigDecimal totalQuantite = BigDecimal.ZERO;
        BigDecimal weightedSum = BigDecimal.ZERO;

        for (ChantierLot lot : lots) {
            AvancementPhysique latest = dernierByLot.get(lot.getId());
            BigDecimal percent = latest != null && latest.getPourcentage() != null
                    ? latest.getPourcentage()
                    : BigDecimal.ZERO;
            BigDecimal rounded = percent.setScale(1, RoundingMode.HALF_UP);
            if (lot.getAvancementPercent() == null || lot.getAvancementPercent().compareTo(rounded) != 0) {
                lot.setAvancementPercent(rounded);
                lotRepository.save(lot);
            }
            if (lot.getQuantite() != null && lot.getQuantite().compareTo(BigDecimal.ZERO) > 0) {
                totalQuantite = totalQuantite.add(lot.getQuantite());
                weightedSum = weightedSum.add(lot.getQuantite().multiply(percent));
            }
        }

        BigDecimal chantierPercent = totalQuantite.compareTo(BigDecimal.ZERO) > 0
                ? weightedSum.divide(totalQuantite, 4, RoundingMode.HALF_UP).setScale(1, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        if (chantier.getAvancementPercent() == null
                || chantier.getAvancementPercent().compareTo(chantierPercent) != 0) {
            chantier.setAvancementPercent(chantierPercent);
            chantierRepository.save(chantier);
        }
    }

    private static UUID tenantId() {
        return TenantContext.getTenantId();
    }
}
