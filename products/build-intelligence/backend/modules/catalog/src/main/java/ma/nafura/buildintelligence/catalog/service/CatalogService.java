package ma.nafura.buildintelligence.catalog.service;

import lombok.RequiredArgsConstructor;
import ma.nafura.buildintelligence.catalog.domain.PriceObservation;
import ma.nafura.buildintelligence.catalog.domain.WorkItem;
import ma.nafura.buildintelligence.catalog.repository.PriceObservationRepository;
import ma.nafura.buildintelligence.catalog.repository.WorkItemRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CatalogService {

    private final WorkItemRepository workItemRepository;
    private final PriceObservationRepository priceObservationRepository;

    @Transactional(readOnly = true)
    public Optional<WorkItem> getWorkItem(UUID id) {
        return workItemRepository.findByIdAndTenantId(id, TenantContext.getTenantId());
    }

    @Transactional(readOnly = true)
    public Page<WorkItem> listWorkItems(Pageable pageable) {
        return workItemRepository.findByTenantId(TenantContext.getTenantId(), pageable);
    }

    @Transactional(readOnly = true)
    public List<WorkItem> searchWorkItems(String query) {
        return workItemRepository.findByTenantIdAndNormalizedDesignationContainingIgnoreCase(
                TenantContext.getTenantId(), normalize(query));
    }

    @Transactional
    public WorkItem upsertFromPayload(Map<String, Object> payload) {
        String designation = String.valueOf(payload.getOrDefault("designationNormalized",
                payload.getOrDefault("designationRaw", "Sans désignation")));
        String normalized = normalize(designation);
        UUID tenantId = TenantContext.getTenantId();

        WorkItem workItem = workItemRepository.findByTenantIdAndNormalizedDesignation(tenantId, normalized)
                .orElseGet(() -> {
                    WorkItem created = new WorkItem();
                    created.setTenantId(tenantId);
                    created.setDesignation(designation);
                    created.setNormalizedDesignation(normalized);
                    created.setUnitCode(String.valueOf(payload.getOrDefault("unit", "u")));
                    created.setValidationStatus("VALIDATED");
                    return created;
                });
        workItem.setDesignation(designation);
        workItem.setUnitCode(String.valueOf(payload.getOrDefault("unit", workItem.getUnitCode())));
        return workItemRepository.save(workItem);
    }

    @Transactional
    public PriceObservation recordPriceObservation(WorkItem workItem, Map<String, Object> payload, BigDecimal confidence, UUID factId) {
        BigDecimal unitPrice = toDecimal(payload.get("unitPrice"));
        if (unitPrice == null) {
            return null;
        }
        PriceObservation observation = new PriceObservation();
        observation.setTenantId(TenantContext.getTenantId());
        observation.setWorkItemId(workItem.getId());
        observation.setPriceType("BPU_PRICE");
        observation.setAmount(unitPrice);
        observation.setCurrency(String.valueOf(payload.getOrDefault("currency", "MAD")));
        observation.setUnitCode(workItem.getUnitCode());
        observation.setQuantity(toDecimal(payload.get("quantity")));
        observation.setObservedAt(LocalDate.now());
        observation.setConfidence(confidence);
        observation.setValidationStatus("VALIDATED");
        observation.setMetadata(Map.of("factId", factId.toString()));
        return priceObservationRepository.save(observation);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> priceStatistics(UUID workItemId) {
        List<PriceObservation> observations = priceObservationRepository
                .findByWorkItemIdAndTenantIdOrderByObservedAtDesc(workItemId, TenantContext.getTenantId());
        if (observations.isEmpty()) {
            return Map.of("observationCount", 0);
        }
        List<BigDecimal> amounts = observations.stream().map(PriceObservation::getAmount).sorted().toList();
        BigDecimal min = amounts.getFirst();
        BigDecimal max = amounts.getLast();
        BigDecimal median = amounts.get(amounts.size() / 2);
        BigDecimal sum = amounts.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal average = sum.divide(BigDecimal.valueOf(amounts.size()), 2, RoundingMode.HALF_UP);
        int p25Index = Math.max(0, (int) Math.floor(amounts.size() * 0.25) - 1);
        int p75Index = Math.min(amounts.size() - 1, (int) Math.ceil(amounts.size() * 0.75) - 1);

        Map<String, Object> result = new HashMap<>();
        result.put("workItemId", workItemId);
        result.put("observationCount", amounts.size());
        result.put("min", min);
        result.put("max", max);
        result.put("median", median);
        result.put("average", average);
        result.put("p25", amounts.get(p25Index));
        result.put("p75", amounts.get(p75Index));
        result.put("currency", observations.getFirst().getCurrency());
        result.put("unit", observations.getFirst().getUnitCode());
        result.put("lastObservationDate", observations.getFirst().getObservedAt());
        return result;
    }

    public static String normalize(String value) {
        if (value == null) {
            return "";
        }
        return value.trim()
                .toLowerCase()
                .replaceAll("\\s+", " ")
                .replace("é", "e")
                .replace("è", "e")
                .replace("à", "a");
    }

    private static BigDecimal toDecimal(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Number number) {
            return BigDecimal.valueOf(number.doubleValue());
        }
        try {
            return new BigDecimal(value.toString().replace(" ", "").replace(",", "."));
        } catch (NumberFormatException ex) {
            return null;
        }
    }
}
