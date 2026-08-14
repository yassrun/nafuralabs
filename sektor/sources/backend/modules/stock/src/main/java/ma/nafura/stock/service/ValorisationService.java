package ma.nafura.stock.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.UUID;
import ma.nafura.item.domain.model.Item;
import ma.nafura.item.repository.ItemRepository;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.stock.domain.model.InventoryTxLine;
import ma.nafura.stock.domain.model.StockBalance;
import ma.nafura.stock.domain.model.StockMove;
import ma.nafura.stock.repository.StockBalanceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Stock-owned valuation (AVCO). Writes unit/total cost on moves and updates item PMP on receipts.
 */
@Service
public class ValorisationService {

    private final ItemRepository itemRepository;
    private final StockBalanceRepository stockBalanceRepository;

    public ValorisationService(ItemRepository itemRepository, StockBalanceRepository stockBalanceRepository) {
        this.itemRepository = itemRepository;
        this.stockBalanceRepository = stockBalanceRepository;
    }

    /**
     * Applies unit/total cost on an inbound move and recalculates item PMP (AVCO).
     */
    @Transactional
    public void applyInboundCost(StockMove move, InventoryTxLine line, UUID locationId) {
        BigDecimal qty = line.getQuantity() != null ? line.getQuantity() : BigDecimal.ZERO;
        BigDecimal unitCost = resolveInboundUnitCost(line);
        move.setUnitCost(unitCost);
        move.setTotalCost(unitCost.multiply(qty).setScale(4, RoundingMode.HALF_UP));
        updatePmpOnReceipt(line.getItemId(), locationId, qty, unitCost);
    }

    /**
     * Prices an outbound move at current PMP (or prix unitaire).
     */
    @Transactional(readOnly = true)
    public void applyOutboundCost(StockMove move, UUID itemId, BigDecimal absoluteQty) {
        BigDecimal unitCost = currentUnitCost(itemId);
        move.setUnitCost(unitCost);
        BigDecimal abs = absoluteQty.abs();
        move.setTotalCost(unitCost.multiply(abs).setScale(4, RoundingMode.HALF_UP));
    }

    @Transactional
    public void updatePmpOnReceipt(UUID itemId, UUID locationId, BigDecimal inboundQty, BigDecimal inboundUnitCost) {
        if (itemId == null || inboundQty == null || inboundQty.signum() <= 0) {
            return;
        }
        UUID tenantId = TenantContext.getTenantId();
        Item item = itemRepository
                .findByIdAndTenantId(itemId, tenantId)
                .orElse(null);
        if (item == null) {
            return;
        }
        // Caller must invoke before updating the balance (previous qty = current solde).
        BigDecimal previousQty = stockBalanceRepository
                .findByTenantIdAndLocationIdAndItemId(tenantId, locationId, itemId)
                .map(StockBalance::getQuantity)
                .orElse(BigDecimal.ZERO);
        if (previousQty == null) {
            previousQty = BigDecimal.ZERO;
        }
        BigDecimal previousPmp = item.getPmp() != null
                ? item.getPmp()
                : (item.getPrixUnitaire() != null ? item.getPrixUnitaire() : BigDecimal.ZERO);
        BigDecimal unit = inboundUnitCost != null ? inboundUnitCost : BigDecimal.ZERO;
        BigDecimal newPmp;
        if (previousQty.signum() <= 0) {
            newPmp = unit;
        } else {
            BigDecimal numerator = previousQty.multiply(previousPmp).add(inboundQty.multiply(unit));
            BigDecimal denominator = previousQty.add(inboundQty);
            newPmp = numerator.divide(denominator, 4, RoundingMode.HALF_UP);
        }
        item.setPmp(newPmp);
        itemRepository.save(item);
    }

    public BigDecimal currentUnitCost(UUID itemId) {
        if (itemId == null) {
            return BigDecimal.ZERO;
        }
        return itemRepository
                .findByIdAndTenantId(itemId, TenantContext.getTenantId())
                .map(item -> {
                    if (item.getPmp() != null && item.getPmp().signum() > 0) {
                        return item.getPmp();
                    }
                    return item.getPrixUnitaire() != null ? item.getPrixUnitaire() : BigDecimal.ZERO;
                })
                .orElse(BigDecimal.ZERO);
    }

    private static BigDecimal resolveInboundUnitCost(InventoryTxLine line) {
        if (line.getUnitPrice() != null) {
            return line.getUnitPrice();
        }
        if (line.getTotalPrice() != null
                && line.getQuantity() != null
                && line.getQuantity().signum() != 0) {
            return line.getTotalPrice().divide(line.getQuantity(), 4, RoundingMode.HALF_UP);
        }
        return BigDecimal.ZERO;
    }
}
