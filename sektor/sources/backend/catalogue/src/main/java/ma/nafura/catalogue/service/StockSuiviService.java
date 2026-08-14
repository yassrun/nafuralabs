package ma.nafura.catalogue.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import ma.nafura.catalogue.domain.model.Item;
import ma.nafura.catalogue.domain.model.ItemCategory;
import ma.nafura.catalogue.repository.ItemCategoryRepository;
import ma.nafura.catalogue.repository.ItemRepository;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.catalogue.api.dto.StockBalanceViewDto;
import ma.nafura.catalogue.api.dto.StockValorisationDto;
import ma.nafura.catalogue.domain.model.Location;
import ma.nafura.catalogue.domain.model.StockBalance;
import ma.nafura.catalogue.repository.LocationRepository;
import ma.nafura.catalogue.repository.StockBalanceRepository;
import ma.nafura.catalogue.repository.StockMoveRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StockSuiviService {

    private final StockBalanceRepository stockBalanceRepository;
    private final LocationRepository locationRepository;
    private final ItemRepository itemRepository;
    private final ItemCategoryRepository itemCategoryRepository;
    private final StockMoveRepository stockMoveRepository;
    private final CostingMethodResolver costingMethodResolver;

    public StockSuiviService(
            StockBalanceRepository stockBalanceRepository,
            LocationRepository locationRepository,
            ItemRepository itemRepository,
            ItemCategoryRepository itemCategoryRepository,
            StockMoveRepository stockMoveRepository,
            CostingMethodResolver costingMethodResolver) {
        this.stockBalanceRepository = stockBalanceRepository;
        this.locationRepository = locationRepository;
        this.itemRepository = itemRepository;
        this.itemCategoryRepository = itemCategoryRepository;
        this.stockMoveRepository = stockMoveRepository;
        this.costingMethodResolver = costingMethodResolver;
    }

    @Transactional(readOnly = true)
    public Page<StockBalanceViewDto> etatStock(int page, int size) {
        UUID tenantId = TenantContext.getTenantId();
        List<StockBalanceViewDto> all = enrichAll(stockBalanceRepository.findByTenantId(tenantId), null);
        return toPage(all, page, size);
    }

    @Transactional(readOnly = true)
    public StockValorisationDto valorisation(LocalDate asOf, int page, int size) {
        UUID tenantId = TenantContext.getTenantId();
        List<StockBalance> balances = stockBalanceRepository.findByTenantId(tenantId);
        List<StockBalanceViewDto> lines;
        if (asOf != null && !asOf.equals(LocalDate.now())) {
            lines = enrichAsOf(balances, asOf);
        } else {
            lines = enrichAll(balances, null);
        }
        BigDecimal total = BigDecimal.ZERO;
        BigDecimal depot = BigDecimal.ZERO;
        BigDecimal chantier = BigDecimal.ZERO;
        for (StockBalanceViewDto line : lines) {
            BigDecimal val = line.getTotalValue() != null ? line.getTotalValue() : BigDecimal.ZERO;
            total = total.add(val);
            if ("CHANTIER".equals(line.getLocationType())) {
                chantier = chantier.add(val);
            } else {
                depot = depot.add(val);
            }
        }
        Page<StockBalanceViewDto> paged = toPage(lines, page, size);
        return StockValorisationDto.builder()
                .totalValue(total.setScale(2, RoundingMode.HALF_UP))
                .depotValue(depot.setScale(2, RoundingMode.HALF_UP))
                .chantierValue(chantier.setScale(2, RoundingMode.HALF_UP))
                .costingMethod(costingMethodResolver.resolveActive().getMethod())
                .asOfDate(asOf != null ? asOf.toString() : LocalDate.now().toString())
                .lines(paged.getContent())
                .build();
    }

    /**
     * Alerts aggregated by item (sum qty across locations) vs stockMin.
     */
    @Transactional(readOnly = true)
    public Page<StockBalanceViewDto> alertes(int page, int size) {
        UUID tenantId = TenantContext.getTenantId();
        List<StockBalanceViewDto> enriched =
                enrichAll(stockBalanceRepository.findByTenantId(tenantId), null);
        Map<UUID, List<StockBalanceViewDto>> byItem =
                enriched.stream().collect(Collectors.groupingBy(StockBalanceViewDto::getItemId));
        List<StockBalanceViewDto> alerts = new ArrayList<>();
        for (Map.Entry<UUID, List<StockBalanceViewDto>> e : byItem.entrySet()) {
            BigDecimal totalQty = e.getValue().stream()
                    .map(StockBalanceViewDto::getQuantity)
                    .filter(q -> q != null)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            StockBalanceViewDto sample = e.getValue().getFirst();
            BigDecimal min = sample.getStockMin();
            if (min != null && min.signum() > 0 && totalQty.compareTo(min) < 0) {
                alerts.add(StockBalanceViewDto.builder()
                        .itemId(sample.getItemId())
                        .itemCode(sample.getItemCode())
                        .itemName(sample.getItemName())
                        .itemCategoryName(sample.getItemCategoryName())
                        .quantity(totalQty)
                        .availableQuantity(totalQty)
                        .stockMin(min)
                        .unitPrice(sample.getUnitPrice())
                        .totalValue(totalQty
                                .multiply(sample.getUnitPrice() != null ? sample.getUnitPrice() : BigDecimal.ZERO)
                                .setScale(2, RoundingMode.HALF_UP))
                        .build());
            }
        }
        alerts.sort(Comparator.comparing(StockBalanceViewDto::getItemCode, Comparator.nullsLast(String::compareTo)));
        return toPage(alerts, page, size);
    }

    private List<StockBalanceViewDto> enrichAsOf(List<StockBalance> balances, LocalDate asOf) {
        UUID tenantId = TenantContext.getTenantId();
        OffsetDateTime asOfTs = asOf.plusDays(1).atStartOfDay().atOffset(ZoneOffset.UTC).minusNanos(1);
        List<StockBalanceViewDto> rows = new ArrayList<>();
        Map<UUID, Item> items = loadItems(tenantId, balances);
        Map<UUID, Location> locations = loadLocations(tenantId, balances);
        Map<UUID, String> categoryNames = loadCategoryNames(tenantId, items);
        for (StockBalance balance : balances) {
            BigDecimal qty = stockMoveRepository.sumQuantityAsOf(
                    tenantId, balance.getLocationId(), balance.getItemId(), asOfTs);
            if (qty == null) {
                qty = BigDecimal.ZERO;
            }
            Item item = items.get(balance.getItemId());
            Location loc = locations.get(balance.getLocationId());
            BigDecimal unit = unitPrice(item);
            rows.add(toView(balance, item, loc, categoryNames, qty, unit));
        }
        return rows;
    }

    private List<StockBalanceViewDto> enrichAll(List<StockBalance> balances, LocalDate ignored) {
        UUID tenantId = TenantContext.getTenantId();
        Map<UUID, Item> items = loadItems(tenantId, balances);
        Map<UUID, Location> locations = loadLocations(tenantId, balances);
        Map<UUID, String> categoryNames = loadCategoryNames(tenantId, items);
        List<StockBalanceViewDto> rows = new ArrayList<>();
        for (StockBalance balance : balances) {
            Item item = items.get(balance.getItemId());
            Location loc = locations.get(balance.getLocationId());
            BigDecimal unit = unitPrice(item);
            rows.add(toView(balance, item, loc, categoryNames, balance.getQuantity(), unit));
        }
        return rows;
    }

    private StockBalanceViewDto toView(
            StockBalance balance,
            Item item,
            Location loc,
            Map<UUID, String> categoryNames,
            BigDecimal qty,
            BigDecimal unit) {
        BigDecimal q = qty != null ? qty : BigDecimal.ZERO;
        return StockBalanceViewDto.builder()
                .id(balance.getId())
                .locationId(balance.getLocationId())
                .locationCode(loc != null ? loc.getCode() : null)
                .locationName(loc != null ? loc.getName() : null)
                .locationType(loc != null ? loc.getType() : null)
                .itemId(balance.getItemId())
                .itemCode(item != null ? item.getCode() : null)
                .itemName(item != null ? item.getName() : null)
                .itemCategoryName(
                        item != null && item.getItemCategoryId() != null
                                ? categoryNames.get(item.getItemCategoryId())
                                : null)
                .quantity(q)
                .reservedQuantity(balance.getReservedQuantity())
                .availableQuantity(balance.getAvailableQuantity())
                .unitPrice(unit)
                .totalValue(q.multiply(unit).setScale(2, RoundingMode.HALF_UP))
                .lastCountDate(balance.getLastCountDate())
                .stockMin(item != null ? item.getStockMin() : null)
                .build();
    }

    private Map<UUID, Item> loadItems(UUID tenantId, List<StockBalance> balances) {
        List<UUID> ids = balances.stream().map(StockBalance::getItemId).distinct().toList();
        Map<UUID, Item> map = new HashMap<>();
        if (ids.isEmpty()) {
            return map;
        }
        for (Item item : itemRepository.findAllById(ids)) {
            if (tenantId.equals(item.getTenantId())) {
                map.put(item.getId(), item);
            }
        }
        return map;
    }

    private Map<UUID, Location> loadLocations(UUID tenantId, List<StockBalance> balances) {
        List<UUID> ids = balances.stream().map(StockBalance::getLocationId).distinct().toList();
        Map<UUID, Location> map = new HashMap<>();
        if (ids.isEmpty()) {
            return map;
        }
        for (Location loc : locationRepository.findAllById(ids)) {
            if (tenantId.equals(loc.getTenantId())) {
                map.put(loc.getId(), loc);
            }
        }
        return map;
    }

    private Map<UUID, String> loadCategoryNames(UUID tenantId, Map<UUID, Item> items) {
        List<UUID> catIds = items.values().stream()
                .map(Item::getItemCategoryId)
                .filter(id -> id != null)
                .distinct()
                .toList();
        Map<UUID, String> map = new HashMap<>();
        if (catIds.isEmpty()) {
            return map;
        }
        for (ItemCategory cat : itemCategoryRepository.findAllById(catIds)) {
            if (tenantId.equals(cat.getTenantId())) {
                map.put(cat.getId(), cat.getName());
            }
        }
        return map;
    }

    private static BigDecimal unitPrice(Item item) {
        if (item == null) {
            return BigDecimal.ZERO;
        }
        if (item.getPmp() != null && item.getPmp().signum() > 0) {
            return item.getPmp();
        }
        return item.getPrixUnitaire() != null ? item.getPrixUnitaire() : BigDecimal.ZERO;
    }

    private static Page<StockBalanceViewDto> toPage(List<StockBalanceViewDto> all, int page, int size) {
        int from = Math.min(page * size, all.size());
        int to = Math.min(from + size, all.size());
        return new PageImpl<>(all.subList(from, to), PageRequest.of(page, size), all.size());
    }
}
