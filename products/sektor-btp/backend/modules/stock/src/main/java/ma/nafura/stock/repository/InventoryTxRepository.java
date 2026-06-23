package ma.nafura.stock.repository;

import java.util.UUID;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import ma.nafura.stock.domain.model.InventoryTx;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface InventoryTxRepository extends TenantScopedRepository<InventoryTx, UUID> {

    Page<InventoryTx> findByTenantIdAndTxType(UUID tenantId, String txType, Pageable pageable);

    boolean existsByTenantIdAndTxNumber(UUID tenantId, String txNumber);

    Page<InventoryTx> findByTenantIdAndChantierBudgetId(UUID tenantId, String chantierBudgetId, Pageable pageable);

    @Query(
            """
            SELECT t FROM InventoryTx t
            WHERE t.tenantId = :tenantId AND (
                t.destLocationId = :locationId OR t.sourceLocationId = :locationId
                OR t.chantierLocationId = :locationId OR t.chantierBudgetId = :chantierKey)
            ORDER BY t.txDate DESC, t.createdAt DESC
            """)
    Page<InventoryTx> findRecentForMagasin(
            @Param("tenantId") UUID tenantId,
            @Param("locationId") UUID locationId,
            @Param("chantierKey") String chantierKey,
            Pageable pageable);
}
