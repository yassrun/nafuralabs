package ma.nafura.catalogue.repository;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import ma.nafura.catalogue.domain.model.StockMove;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface StockMoveRepository extends TenantScopedRepository<StockMove, UUID> {

    List<StockMove> findByTenantIdAndInventoryTxId(UUID tenantId, UUID inventoryTxId);

    List<StockMove> findByTenantIdAndLocationIdAndItemIdOrderByMovedAtAsc(
            UUID tenantId, UUID locationId, UUID itemId);

    @Query(
            """
            SELECT COALESCE(SUM(m.quantity), 0)
            FROM StockMove m
            WHERE m.tenantId = :tenantId
              AND m.locationId = :locationId
              AND m.itemId = :itemId
            """)
    BigDecimal sumQuantity(
            @Param("tenantId") UUID tenantId,
            @Param("locationId") UUID locationId,
            @Param("itemId") UUID itemId);

    @Query(
            """
            SELECT COALESCE(SUM(m.quantity), 0)
            FROM StockMove m
            WHERE m.tenantId = :tenantId
              AND m.locationId = :locationId
              AND m.itemId = :itemId
              AND m.movedAt <= :asOf
            """)
    BigDecimal sumQuantityAsOf(
            @Param("tenantId") UUID tenantId,
            @Param("locationId") UUID locationId,
            @Param("itemId") UUID itemId,
            @Param("asOf") OffsetDateTime asOf);

    @Query(
            """
            SELECT COALESCE(SUM(CASE WHEN m.quantity < 0 THEN COALESCE(m.totalCost, 0) ELSE 0 END), 0)
            FROM StockMove m
            WHERE m.tenantId = :tenantId
              AND m.movedAt >= :from
              AND m.movedAt < :to
            """)
    BigDecimal sumOutboundCostBetween(
            @Param("tenantId") UUID tenantId,
            @Param("from") OffsetDateTime from,
            @Param("to") OffsetDateTime to);
}
