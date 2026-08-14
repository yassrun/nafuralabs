package ma.nafura.chantiers.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import ma.nafura.chantiers.domain.avancement.AvancementPhysique;
import ma.nafura.chantiers.domain.chantier.Chantier;
import ma.nafura.chantiers.domain.chantier.ChantierLot;
import ma.nafura.chantiers.domain.budget.PosteBudgetaire;
import ma.nafura.chantiers.repository.AvancementPhysiqueRepository;
import ma.nafura.chantiers.repository.ChantierLotRepository;
import ma.nafura.chantiers.repository.ChantierRepository;
import ma.nafura.chantiers.repository.PosteBudgetaireRepository;
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
    private final PosteBudgetaireRepository posteRepository;

    public ChantierProgressSyncService(
            AvancementPhysiqueRepository avancementRepository,
            ChantierLotRepository lotRepository,
            ChantierRepository chantierRepository,
            PosteBudgetaireRepository posteRepository) {
        this.avancementRepository = avancementRepository;
        this.lotRepository = lotRepository;
        this.chantierRepository = chantierRepository;
        this.posteRepository = posteRepository;
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
        Map<String, AvancementPhysique> dernierByProgressKey = new HashMap<>();
        for (AvancementPhysique row : rows) {
            dernierByProgressKey.putIfAbsent(progressKey(row.getLotId(), row.getPosteId()), row);
        }

        List<ChantierLot> lots =
                lotRepository.findByTenantIdAndChantierIdOrderByOrdreAscCodeAsc(tenantId, chantierId);
        Map<String, List<ChantierLot>> childrenByParent = new HashMap<>();
        for (ChantierLot lot : lots) {
            if (StringUtils.hasText(lot.getParentLotId())) {
                childrenByParent.computeIfAbsent(lot.getParentLotId(), key -> new ArrayList<>()).add(lot);
            }
        }

        Map<String, List<PosteBudgetaire>> postesByLotId = new HashMap<>();
        for (ChantierLot lot : lots) {
            postesByLotId.put(
                    lot.getId(),
                    posteRepository.findByTenantIdAndLotIdOrderByOrdreAscCodeAsc(tenantId, lot.getId()));
        }

        Map<String, BigDecimal> percentByLotId = new HashMap<>();
        Map<String, ChantierLot> lotById = new HashMap<>();
        for (ChantierLot lot : lots) {
            lotById.put(lot.getId(), lot);
        }
        for (ChantierLot lot : lots) {
            percentByLotId.put(
                    lot.getId(),
                    resolveLotPercent(lot, lotById, childrenByParent, postesByLotId, dernierByProgressKey, percentByLotId));
        }

        BigDecimal totalWeight = BigDecimal.ZERO;
        BigDecimal weightedSum = BigDecimal.ZERO;

        for (ChantierLot lot : lots) {
            BigDecimal percent = percentByLotId.getOrDefault(lot.getId(), BigDecimal.ZERO);
            BigDecimal rounded = percent.setScale(1, RoundingMode.HALF_UP);
            if (lot.getAvancementPercent() == null || lot.getAvancementPercent().compareTo(rounded) != 0) {
                lot.setAvancementPercent(rounded);
                lotRepository.save(lot);
            }

            if (!StringUtils.hasText(lot.getParentLotId())) {
                BigDecimal weight = lotWeight(lot, childrenByParent, postesByLotId, percentByLotId);
                if (weight.compareTo(BigDecimal.ZERO) > 0) {
                    totalWeight = totalWeight.add(weight);
                    weightedSum = weightedSum.add(weight.multiply(percent));
                }
            }
        }

        BigDecimal chantierPercent = totalWeight.compareTo(BigDecimal.ZERO) > 0
                ? weightedSum.divide(totalWeight, 4, RoundingMode.HALF_UP).setScale(1, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        if (chantier.getAvancementPercent() == null
                || chantier.getAvancementPercent().compareTo(chantierPercent) != 0) {
            chantier.setAvancementPercent(chantierPercent);
            chantierRepository.save(chantier);
        }
    }

    private BigDecimal resolveLotPercent(
            ChantierLot lot,
            Map<String, ChantierLot> lotById,
            Map<String, List<ChantierLot>> childrenByParent,
            Map<String, List<PosteBudgetaire>> postesByLotId,
            Map<String, AvancementPhysique> dernierByProgressKey,
            Map<String, BigDecimal> percentByLotId) {
        if (percentByLotId.containsKey(lot.getId())) {
            return percentByLotId.get(lot.getId());
        }

        BigDecimal percent = computeLotPercent(
                lot, lotById, childrenByParent, postesByLotId, dernierByProgressKey, percentByLotId);
        percentByLotId.put(lot.getId(), percent);
        return percent;
    }

    private BigDecimal computeLotPercent(
            ChantierLot lot,
            Map<String, ChantierLot> lotById,
            Map<String, List<ChantierLot>> childrenByParent,
            Map<String, List<PosteBudgetaire>> postesByLotId,
            Map<String, AvancementPhysique> dernierByProgressKey,
            Map<String, BigDecimal> percentByLotId) {
        List<PosteBudgetaire> postes = postesByLotId.getOrDefault(lot.getId(), List.of());
        if (!postes.isEmpty()) {
            return weightedPostePercent(lot.getId(), postes, dernierByProgressKey);
        }

        List<ChantierLot> children = childrenByParent.getOrDefault(lot.getId(), List.of());
        if (!children.isEmpty()) {
            BigDecimal totalWeight = BigDecimal.ZERO;
            BigDecimal weightedSum = BigDecimal.ZERO;
            for (ChantierLot child : children) {
                BigDecimal childWeight = childWeight(child, postesByLotId);
                if (childWeight.compareTo(BigDecimal.ZERO) <= 0) {
                    continue;
                }
                BigDecimal childPercent = resolveLotPercent(
                        child, lotById, childrenByParent, postesByLotId, dernierByProgressKey, percentByLotId);
                totalWeight = totalWeight.add(childWeight);
                weightedSum = weightedSum.add(childWeight.multiply(childPercent));
            }
            if (totalWeight.compareTo(BigDecimal.ZERO) > 0) {
                return weightedSum.divide(totalWeight, 4, RoundingMode.HALF_UP);
            }
        }

        AvancementPhysique latest = dernierByProgressKey.get(progressKey(lot.getId(), null));
        return latest != null && latest.getPourcentage() != null ? latest.getPourcentage() : BigDecimal.ZERO;
    }

    private static BigDecimal weightedPostePercent(
            String lotId,
            List<PosteBudgetaire> postes,
            Map<String, AvancementPhysique> dernierByProgressKey) {
        BigDecimal totalWeight = BigDecimal.ZERO;
        BigDecimal weightedSum = BigDecimal.ZERO;
        for (PosteBudgetaire poste : postes) {
            BigDecimal weight = posteWeight(poste);
            if (weight.compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }
            AvancementPhysique latest = dernierByProgressKey.get(progressKey(lotId, poste.getId()));
            BigDecimal percent = latest != null && latest.getPourcentage() != null
                    ? latest.getPourcentage()
                    : BigDecimal.ZERO;
            totalWeight = totalWeight.add(weight);
            weightedSum = weightedSum.add(weight.multiply(percent));
        }
        if (totalWeight.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        return weightedSum.divide(totalWeight, 4, RoundingMode.HALF_UP);
    }

    private static BigDecimal lotWeight(
            ChantierLot lot,
            Map<String, List<ChantierLot>> childrenByParent,
            Map<String, List<PosteBudgetaire>> postesByLotId,
            Map<String, BigDecimal> percentByLotId) {
        List<PosteBudgetaire> postes = postesByLotId.getOrDefault(lot.getId(), List.of());
        if (!postes.isEmpty()) {
            return postes.stream().map(ChantierProgressSyncService::posteWeight).reduce(BigDecimal.ZERO, BigDecimal::add);
        }
        List<ChantierLot> children = childrenByParent.getOrDefault(lot.getId(), List.of());
        if (!children.isEmpty()) {
            return children.stream()
                    .map(child -> childWeight(child, postesByLotId))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
        }
        if (lot.getMontantHt() != null && lot.getMontantHt().compareTo(BigDecimal.ZERO) > 0) {
            return lot.getMontantHt();
        }
        if (lot.getQuantite() != null && lot.getQuantite().compareTo(BigDecimal.ZERO) > 0) {
            return lot.getQuantite();
        }
        return percentByLotId.containsKey(lot.getId()) ? BigDecimal.ONE : BigDecimal.ZERO;
    }

    private static BigDecimal childWeight(ChantierLot child, Map<String, List<PosteBudgetaire>> postesByLotId) {
        List<PosteBudgetaire> postes = postesByLotId.getOrDefault(child.getId(), List.of());
        if (!postes.isEmpty()) {
            return postes.stream().map(ChantierProgressSyncService::posteWeight).reduce(BigDecimal.ZERO, BigDecimal::add);
        }
        if (child.getMontantHt() != null && child.getMontantHt().compareTo(BigDecimal.ZERO) > 0) {
            return child.getMontantHt();
        }
        if (child.getQuantite() != null && child.getQuantite().compareTo(BigDecimal.ZERO) > 0) {
            return child.getQuantite();
        }
        return BigDecimal.ZERO;
    }

    private static BigDecimal posteWeight(PosteBudgetaire poste) {
        if (poste.getMontantHt() != null && poste.getMontantHt().compareTo(BigDecimal.ZERO) > 0) {
            return poste.getMontantHt();
        }
        if (poste.getQuantite() != null
                && poste.getPrixUnitaireHt() != null
                && poste.getQuantite().compareTo(BigDecimal.ZERO) > 0) {
            return poste.getQuantite().multiply(poste.getPrixUnitaireHt());
        }
        if (poste.getQuantite() != null && poste.getQuantite().compareTo(BigDecimal.ZERO) > 0) {
            return poste.getQuantite();
        }
        return BigDecimal.ZERO;
    }

    private static String progressKey(String lotId, String posteId) {
        return (lotId != null ? lotId : "") + "::" + (posteId != null ? posteId : "");
    }

    private static UUID tenantId() {
        return TenantContext.getTenantId();
    }
}
