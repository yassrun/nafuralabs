package ma.nafura.buildintelligence.extraction.repository;

import ma.nafura.buildintelligence.extraction.domain.ExtractionRun;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ExtractionRunRepository extends TenantScopedRepository<ExtractionRun, UUID> {

    List<ExtractionRun> findByDocumentIdAndTenantIdOrderByCreatedAtDesc(UUID documentId, UUID tenantId);
}
