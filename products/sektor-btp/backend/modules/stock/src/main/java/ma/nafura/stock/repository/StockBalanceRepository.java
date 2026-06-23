package ma.nafura.stock.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.stock.domain.model.StockBalance;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Repository for StockBalance entity.
 * Generated once — add custom queries here.
 */
@Repository
public interface StockBalanceRepository extends TenantScopedRepository<StockBalance, UUID> {

    List<StockBalance> findByTenantIdAndWarehouseId(UUID tenantId, UUID warehouseId);

    Optional<StockBalance> findByTenantIdAndWarehouseIdAndItemId(UUID tenantId, UUID warehouseId, UUID itemId);

    Page<StockBalance> findByTenantIdAndWarehouseId(UUID tenantId, UUID warehouseId, Pageable pageable);

    Page<StockBalance> findByTenantIdAndItemId(UUID tenantId, UUID itemId, Pageable pageable);

    Page<StockBalance> findByTenantIdAndWarehouseIdAndItemId(
            UUID tenantId, UUID warehouseId, UUID itemId, Pageable pageable);

    @Query(
            """
            SELECT sb.itemId AS itemId, COALESCE(SUM(sb.quantity), 0) AS totalQuantity
            FROM StockBalance sb
            WHERE sb.tenantId = :tenantId AND sb.itemId IN :itemIds
            GROUP BY sb.itemId
            """)
    List<ItemQuantityProjection> aggregateQuantityByItemIds(
            @Param("tenantId") UUID tenantId, @Param("itemIds") Collection<UUID> itemIds);

    interface ItemQuantityProjection {
        UUID getItemId();

        java.math.BigDecimal getTotalQuantity();
    }
}
