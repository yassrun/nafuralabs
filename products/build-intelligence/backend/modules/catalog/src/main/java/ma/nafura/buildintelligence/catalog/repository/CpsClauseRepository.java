package ma.nafura.buildintelligence.catalog.repository;

import ma.nafura.buildintelligence.catalog.domain.CpsClause;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface CpsClauseRepository extends TenantScopedRepository<CpsClause, UUID> {

    Page<CpsClause> findByTenantIdAndTitleContainingIgnoreCase(UUID tenantId, String query, Pageable pageable);
}
