package ma.nafura.catalogue.service;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import ma.nafura.catalogue.api.dto.ItemQuantityAggregateDto;
import ma.nafura.catalogue.domain.stock.StockBalance;
import ma.nafura.catalogue.mapper.StockBalanceMapper;
import ma.nafura.catalogue.repository.StockBalanceRepository;
import ma.nafura.catalogue.service.base.StockBalanceServiceBase;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StockBalanceService extends StockBalanceServiceBase {

    public StockBalanceService(StockBalanceRepository repository, StockBalanceMapper mapper) {
        super(repository, mapper);
    }

    /** Filter list by warehouse and/or item; prefers Spring Page queries when paging (tenant-scoped). */
    @Transactional(readOnly = true)
    public Page<StockBalance> listFiltered(UUID locationId, UUID itemId, int page, int size) {
        return listFiltered(locationId, itemId, page, size, null);
    }

    @Transactional(readOnly = true)
    public Page<StockBalance> listFiltered(UUID locationId, UUID itemId, int page, int size, Sort sort) {
        UUID tenantId = tenantId();
        Pageable pageable = sort != null ? PageRequest.of(page, size, sort) : PageRequest.of(page, size);
        if (locationId != null && itemId != null) {
            return stockBalanceRepository.findByTenantIdAndLocationIdAndItemId(
                    tenantId, locationId, itemId, pageable);
        }
        if (locationId != null) {
            return stockBalanceRepository.findByTenantIdAndLocationId(tenantId, locationId, pageable);
        }
        return stockBalanceRepository.findByTenantIdAndItemId(tenantId, itemId, pageable);
    }

    /**
     * Returns one row per distinct {@code itemIds} entry (stable order), including zeros when no balance rows exist.
     */
    @Transactional(readOnly = true)
    public List<ItemQuantityAggregateDto> aggregateQuantityByItemIds(List<UUID> itemIds) {
        if (itemIds == null || itemIds.isEmpty()) {
            return List.of();
        }
        List<UUID> orderedDistinct = itemIds.stream().distinct().toList();
        Map<UUID, BigDecimal> sums = new LinkedHashMap<>();
        for (UUID id : orderedDistinct) {
            sums.put(id, BigDecimal.ZERO);
        }
        for (StockBalanceRepository.ItemQuantityProjection row :
                stockBalanceRepository.aggregateQuantityByItemIds(tenantId(), orderedDistinct)) {
            sums.put(row.getItemId(), row.getTotalQuantity());
        }
        return sums.entrySet().stream()
                .map(e -> new ItemQuantityAggregateDto(e.getKey(), e.getValue()))
                .toList();
    }
}
