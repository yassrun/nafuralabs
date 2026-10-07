package ma.nafura.platform.authorization.repository;

import ma.nafura.platform.authorization.domain.model.ApiKey;
import ma.nafura.platform.framework.record.RecordRepository;

import java.util.Optional;
import java.util.UUID;

public interface ApiKeyRepository extends RecordRepository<ApiKey> {

    Optional<ApiKey> findByKeyPrefix(String keyPrefix);

    long countByTenantIdAndActiveIsTrue(UUID tenantId);

    Optional<ApiKey> findByIdAndTenantId(UUID id, UUID tenantId);
}
