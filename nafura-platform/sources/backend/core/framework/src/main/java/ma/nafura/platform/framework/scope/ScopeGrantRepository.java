package ma.nafura.platform.framework.scope;

import java.util.List;
import java.util.UUID;

import ma.nafura.platform.framework.record.RecordRepository;

public interface ScopeGrantRepository extends RecordRepository<ScopeGrant> {

    List<ScopeGrant> findByTenantIdAndUserId(UUID tenantId, UUID userId);
}
