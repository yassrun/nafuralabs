package ma.nafura.catalogue.service;

import java.math.BigDecimal;
import java.util.UUID;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.catalogue.domain.model.StockBalance;
import ma.nafura.catalogue.repository.StockBalanceRepository;
import ma.nafura.catalogue.repository.StockMoveRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StockLedgerService {

    private final StockMoveRepository stockMoveRepository;
    private final StockBalanceRepository stockBalanceRepository;

    public StockLedgerService(
            StockMoveRepository stockMoveRepository, StockBalanceRepository stockBalanceRepository) {
        this.stockMoveRepository = stockMoveRepository;
        this.stockBalanceRepository = stockBalanceRepository;
    }

    public record ReconcileResult(
            UUID itemId, UUID locationId, BigDecimal balanceQty, BigDecimal movesSum, boolean consistent) {}

    @Transactional(readOnly = true)
    public ReconcileResult reconcile(UUID itemId, UUID locationId) {
        UUID tenantId = TenantContext.getTenantId();
        BigDecimal movesSum = stockMoveRepository.sumQuantity(tenantId, locationId, itemId);
        if (movesSum == null) {
            movesSum = BigDecimal.ZERO;
        }
        BigDecimal balanceQty = stockBalanceRepository
                .findByTenantIdAndLocationIdAndItemId(tenantId, locationId, itemId)
                .map(StockBalance::getQuantity)
                .orElse(BigDecimal.ZERO);
        if (balanceQty == null) {
            balanceQty = BigDecimal.ZERO;
        }
        boolean consistent = balanceQty.compareTo(movesSum) == 0;
        return new ReconcileResult(itemId, locationId, balanceQty, movesSum, consistent);
    }
}
