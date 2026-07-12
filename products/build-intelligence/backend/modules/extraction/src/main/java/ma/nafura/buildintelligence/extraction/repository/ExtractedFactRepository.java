package ma.nafura.buildintelligence.extraction.repository;

import ma.nafura.buildintelligence.extraction.domain.ExtractedFact;
import ma.nafura.buildintelligence.extraction.domain.ValidationStatus;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ExtractedFactRepository extends TenantScopedRepository<ExtractedFact, UUID> {

    List<ExtractedFact> findByExtractionRunIdAndTenantId(UUID extractionRunId, UUID tenantId);

    List<ExtractedFact> findByTenantIdAndValidationStatus(UUID tenantId, ValidationStatus status);
}
