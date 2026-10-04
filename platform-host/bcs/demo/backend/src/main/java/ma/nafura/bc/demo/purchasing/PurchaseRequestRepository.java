package ma.nafura.bc.demo.purchasing;

import java.util.List;
import java.util.UUID;

import ma.nafura.platform.framework.record.RecordRepository;

public interface PurchaseRequestRepository extends RecordRepository<PurchaseRequest> {

    List<PurchaseRequest> findByTenantIdAndSupplierId(UUID tenantId, UUID supplierId);
}
