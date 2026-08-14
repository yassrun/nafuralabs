package ma.nafura.platform.framework.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.repository.NoRepositoryBean;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Base tenant-aware repository contract for multi-tenant entities.
 * Extends JpaSpecificationExecutor to enable flexible criteria-based queries.
 */
@NoRepositoryBean
public interface TenantScopedRepository<TEntity, TId> extends JpaRepository<TEntity, TId>, JpaSpecificationExecutor<TEntity> {

    Optional<TEntity> findByIdAndTenantId(TId id, UUID tenantId);

    boolean existsByIdAndTenantId(TId id, UUID tenantId);

    List<TEntity> findByTenantId(UUID tenantId);

    Page<TEntity> findByTenantId(UUID tenantId, Pageable pageable);

    long countByTenantId(UUID tenantId);
}

