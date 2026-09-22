package ma.nafura.sandbox.domain;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import ma.nafura.platform.framework.repository.TenantScopedRepository;

public interface SandboxProductRepository extends TenantScopedRepository<SandboxProduct, String> {

    List<SandboxProduct> findAllByOrderByCodeAsc();

    Optional<SandboxProduct> findByIdAndTenantId(String id, UUID tenantId);

    boolean existsByIdAndTenantId(String id, UUID tenantId);

    List<SandboxProduct> findByTenantId(UUID tenantId);

    Page<SandboxProduct> findByTenantId(UUID tenantId, Pageable pageable);

    long countByTenantId(UUID tenantId);
}
