package ma.nafura.stock.repository;

import java.util.List;
import java.util.UUID;
import ma.nafura.stock.domain.model.InventoryTxLine;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InventoryTxLineRepository extends TenantScopedRepository<InventoryTxLine, UUID> {

    List<InventoryTxLine> findByTenantIdAndInventoryTxIdOrderByLineNumberAsc(UUID tenantId, UUID inventoryTxId);

    void deleteByTenantIdAndInventoryTxId(UUID tenantId, UUID inventoryTxId);
}
