package ma.nafura.stock.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.item.domain.model.Item;
import ma.nafura.item.repository.ItemRepository;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.stock.api.dto.MagasinChantierDto;
import ma.nafura.stock.api.dto.MagasinMouvementDto;
import ma.nafura.stock.api.dto.MagasinStockArticleDto;
import ma.nafura.stock.domain.model.InventoryTx;
import ma.nafura.stock.domain.model.InventoryTxLine;
import ma.nafura.stock.domain.model.Location;
import ma.nafura.stock.domain.model.StockBalance;
import ma.nafura.stock.repository.InventoryTxLineRepository;
import ma.nafura.stock.repository.InventoryTxRepository;
import ma.nafura.stock.repository.LocationRepository;
import ma.nafura.stock.repository.StockBalanceRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class MagasinChantierReadService {

    private static final int RECENT_MOVEMENT_LIMIT = 10;
    private static final String LOCATION_TYPE_CHANTIER = "CHANTIER";

    private final LocationRepository locationRepository;
    private final StockBalanceRepository stockBalanceRepository;
    private final InventoryTxRepository inventoryTxRepository;
    private final InventoryTxLineRepository inventoryTxLineRepository;
    private final ItemRepository itemRepository;

    public MagasinChantierReadService(
            LocationRepository locationRepository,
            StockBalanceRepository stockBalanceRepository,
            InventoryTxRepository inventoryTxRepository,
            InventoryTxLineRepository inventoryTxLineRepository,
            ItemRepository itemRepository) {
        this.locationRepository = locationRepository;
        this.stockBalanceRepository = stockBalanceRepository;
        this.inventoryTxRepository = inventoryTxRepository;
        this.inventoryTxLineRepository = inventoryTxLineRepository;
        this.itemRepository = itemRepository;
    }

    @Transactional(readOnly = true)
    public MagasinChantierDto getMagasin(String chantierKey) {
        String key = chantierKey == null ? "" : chantierKey.trim();
        if (key.isEmpty()) {
            throw notFound();
        }
        UUID tenantId = tenantId();
        ResolvedChantier resolved = resolveChantier(tenantId, key);
        Location depot = resolved.depot();

        List<StockBalance> balances =
                stockBalanceRepository.findByTenantIdAndWarehouseId(tenantId, depot.getId());
        Map<UUID, Item> itemsById = loadItems(tenantId, balances);

        List<MagasinStockArticleDto> stockArticles = new ArrayList<>();
        BigDecimal totalValorisation = BigDecimal.ZERO;
        for (StockBalance balance : balances) {
            if (balance.getQuantity() == null || balance.getQuantity().signum() <= 0) {
                continue;
            }
            Item item = itemsById.get(balance.getItemId());
            BigDecimal unitPrice = unitPrice(item);
            BigDecimal valorisation =
                    balance.getQuantity().multiply(unitPrice).setScale(2, RoundingMode.HALF_UP);
            totalValorisation = totalValorisation.add(valorisation);
            stockArticles.add(new MagasinStockArticleDto(
                    balance.getItemId(),
                    item != null ? item.getCode() : null,
                    item != null ? item.getName() : balance.getItemId().toString(),
                    balance.getQuantity(),
                    unitPrice,
                    valorisation));
        }

        Page<InventoryTx> recentPage = inventoryTxRepository.findRecentForMagasin(
                tenantId,
                depot.getId(),
                resolved.budgetChantierId(),
                PageRequest.of(0, RECENT_MOVEMENT_LIMIT));
        List<MagasinMouvementDto> mouvements = recentPage.getContent().stream()
                .map(tx -> toMouvementDto(tenantId, tx))
                .toList();

        return new MagasinChantierDto(
                resolved.budgetChantierId(),
                depot.getName(),
                depot.getId(),
                depot.getCode(),
                depot.getName(),
                stockArticles,
                mouvements,
                totalValorisation.setScale(2, RoundingMode.HALF_UP));
    }

    private ResolvedChantier resolveChantier(UUID tenantId, String key) {
        Optional<UUID> uuidKey = tryParseUuid(key);
        if (uuidKey.isPresent()) {
            Optional<Location> byId = locationRepository
                    .findByIdAndTenantId(uuidKey.get(), tenantId)
                    .filter(this::isChantierDepot);
            if (byId.isPresent()) {
                return new ResolvedChantier(key, byId.get());
            }
        }

        Optional<Location> byCode = locationRepository.findByTenantIdAndCode(tenantId, key).filter(this::isChantierDepot);
        if (byCode.isPresent()) {
            return new ResolvedChantier(key, byCode.get());
        }

        Page<InventoryTx> hint = inventoryTxRepository.findByTenantIdAndChantierBudgetId(
                tenantId, key, PageRequest.of(0, 1, Sort.by(Sort.Direction.DESC, "txDate", "createdAt")));
        if (!hint.isEmpty()) {
            InventoryTx tx = hint.getContent().get(0);
            UUID locationId = firstNonNull(tx.getChantierLocationId(), tx.getDestLocationId(), tx.getWarehouseId());
            if (locationId != null) {
                Optional<Location> fromTx = locationRepository
                        .findByIdAndTenantId(locationId, tenantId)
                        .filter(this::isChantierDepot);
                if (fromTx.isPresent()) {
                    return new ResolvedChantier(key, fromTx.get());
                }
            }
        }

        throw notFound();
    }

    private Map<UUID, Item> loadItems(UUID tenantId, List<StockBalance> balances) {
        List<UUID> itemIds =
                balances.stream().map(StockBalance::getItemId).distinct().toList();
        if (itemIds.isEmpty()) {
            return Map.of();
        }
        Map<UUID, Item> items = new HashMap<>();
        for (Item item : itemRepository.findAllById(itemIds)) {
            if (tenantId.equals(item.getTenantId())) {
                items.put(item.getId(), item);
            }
        }
        return items;
    }

    private MagasinMouvementDto toMouvementDto(UUID tenantId, InventoryTx tx) {
        List<InventoryTxLine> lines =
                inventoryTxLineRepository.findByTenantIdAndInventoryTxIdOrderByLineNumberAsc(tenantId, tx.getId());
        BigDecimal totalQty = lines.stream()
                .map(InventoryTxLine::getQuantity)
                .filter(q -> q != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return new MagasinMouvementDto(
                tx.getId(),
                tx.getTxNumber(),
                tx.getTxType(),
                tx.getTxDate(),
                tx.getStatus(),
                totalQty);
    }

    private static BigDecimal unitPrice(Item item) {
        if (item == null) {
            return BigDecimal.ZERO;
        }
        if (item.getPmp() != null && item.getPmp().signum() > 0) {
            return item.getPmp();
        }
        if (item.getPrixUnitaire() != null) {
            return item.getPrixUnitaire();
        }
        return BigDecimal.ZERO;
    }

    private boolean isChantierDepot(Location location) {
        return location != null
                && LOCATION_TYPE_CHANTIER.equalsIgnoreCase(location.getType());
    }

    private static Optional<UUID> tryParseUuid(String value) {
        try {
            return Optional.of(UUID.fromString(value));
        } catch (IllegalArgumentException ex) {
            return Optional.empty();
        }
    }

    @SafeVarargs
    private static <T> T firstNonNull(T... values) {
        for (T value : values) {
            if (value != null) {
                return value;
            }
        }
        return null;
    }

    private static ResponseStatusException notFound() {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "Chantier magasin not found");
    }

    private static UUID tenantId() {
        return TenantContext.getTenantId();
    }

    private record ResolvedChantier(String budgetChantierId, Location depot) {}
}
