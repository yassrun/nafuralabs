package ma.nafura.platform.authorization.repository;

import ma.nafura.platform.authorization.domain.model.ApiKey;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ApiKeyRepository extends JpaRepository<ApiKey, UUID> {

    Optional<ApiKey> findByKeyPrefix(String keyPrefix);

    long countByTenantIdAndActiveIsTrue(UUID tenantId);

    Page<ApiKey> findByTenantIdOrderByCreatedAtDesc(UUID tenantId, Pageable pageable);

    Optional<ApiKey> findByIdAndTenantId(UUID id, UUID tenantId);
}
