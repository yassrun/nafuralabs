package ma.nafura.catalogue.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.time.YearMonth;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import ma.nafura.catalogue.domain.model.Item;
import ma.nafura.catalogue.repository.ItemRepository;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.catalogue.api.dto.StockKpiDto;
import ma.nafura.catalogue.domain.model.Location;
import ma.nafura.catalogue.domain.model.StockBalance;
import ma.nafura.catalogue.repository.LocationRepository;
import ma.nafura.catalogue.repository.StockBalanceRepository;
import ma.nafura.catalogue.repository.StockMoveRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StockKpiService {

    private static final String LOCATION_TYPE_CHANTIER = "CHANTIER";

    private final StockBalanceRepository stockBalanceRepository;
    private final LocationRepository locationRepository;
    private final ItemRepository itemRepository;
    private final StockMoveRepository stockMoveRepository;

    public StockKpiService(
            StockBalanceRepository stockBalanceRepository,
            LocationRepository locationRepository,
            ItemRepository itemRepository,
            StockMoveRepository stockMoveRepository) {
        this.stockBalanceRepository = stockBalanceRepository;
        this.locationRepository = locationRepository;
        this.itemRepository = itemRepository;
        this.stockMoveRepository = stockMoveRepository;
    }

    @Transactional(readOnly = true)
    public StockKpiDto compute() {
        UUID tenantId = TenantContext.getTenantId();
        List<StockBalance> balances = stockBalanceRepository.findByTenantId(tenantId);
        Map<UUID, Item> itemsById = loadItems(tenantId, balances);

        BigDecimal valorisationStock = BigDecimal.ZERO;
        BigDecimal valoMagasinChantier = BigDecimal.ZERO;

        for (StockBalance balance : balances) {
            if (balance.getQuantity() == null || balance.getQuantity().signum() <= 0) {
                continue;
            }
            Item item = itemsById.get(balance.getItemId());
            BigDecimal unitPrice = unitPrice(item);
            BigDecimal lineVal = balance.getQuantity().multiply(unitPrice).setScale(2, RoundingMode.HALF_UP);
            valorisationStock = valorisationStock.add(lineVal);
            if (isChantierLocation(tenantId, balance.getLocationId())) {
                valoMagasinChantier = valoMagasinChantier.add(lineVal);
            }
        }

        double rotation = computeRotation(tenantId, valorisationStock);

        return StockKpiDto.builder()
                .valorisationStock(scale2(valorisationStock))
                .rotation(rotation)
                .valoMagasinChantier(scale2(valoMagasinChantier))
                .build();
    }

    /** sorties valorisées / stock moyen — approx stock moyen = valorisation courante. */
    private double computeRotation(UUID tenantId, BigDecimal valorisationStock) {
        if (valorisationStock == null || valorisationStock.signum() <= 0) {
            return 0.0;
        }
        YearMonth ym = YearMonth.now();
        OffsetDateTime from = ym.atDay(1).atStartOfDay().atOffset(OffsetDateTime.now().getOffset());
        OffsetDateTime to = ym.plusMonths(1).atDay(1).atStartOfDay().atOffset(OffsetDateTime.now().getOffset());
        BigDecimal outboundValue = stockMoveRepository.sumOutboundCostBetween(tenantId, from, to);
        if (outboundValue == null || outboundValue.signum() <= 0) {
            return 0.0;
        }
        return outboundValue
                .divide(valorisationStock, 4, RoundingMode.HALF_UP)
                .doubleValue();
    }

    private boolean isChantierLocation(UUID tenantId, UUID locationId) {
        if (locationId == null) {
            return false;
        }
        return locationRepository
                .findByIdAndTenantId(locationId, tenantId)
                .map(loc -> LOCATION_TYPE_CHANTIER.equals(loc.getType())
                        || (loc.getCode() != null && loc.getCode().startsWith("CH-")))
                .orElse(false);
    }

    private Map<UUID, Item> loadItems(UUID tenantId, List<StockBalance> balances) {
        List<UUID> itemIds = balances.stream().map(StockBalance::getItemId).distinct().toList();
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

    private static BigDecimal scale2(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }
}
