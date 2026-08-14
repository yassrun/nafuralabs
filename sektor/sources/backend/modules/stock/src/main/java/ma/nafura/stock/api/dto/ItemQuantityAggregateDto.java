package ma.nafura.stock.api.dto;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Total stocked quantity for an item (summed across warehouses/locations for the tenant).
 */
public record ItemQuantityAggregateDto(UUID itemId, BigDecimal totalQuantity) {}
