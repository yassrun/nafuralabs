package ma.nafura.buildintelligence.extraction.repository;

import ma.nafura.buildintelligence.extraction.domain.AnalysisJob;
import ma.nafura.buildintelligence.extraction.domain.AnalysisJobStatus;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AnalysisJobRepository extends TenantScopedRepository<AnalysisJob, UUID> {

    Optional<AnalysisJob> findByIdempotencyKey(String idempotencyKey);

    long countByTenantIdAndStatus(UUID tenantId, AnalysisJobStatus status);
}
