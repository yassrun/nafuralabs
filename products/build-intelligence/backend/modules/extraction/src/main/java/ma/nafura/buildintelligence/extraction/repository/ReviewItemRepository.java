package ma.nafura.buildintelligence.extraction.repository;

import ma.nafura.buildintelligence.extraction.domain.ReviewItem;
import ma.nafura.buildintelligence.extraction.domain.ValidationStatus;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReviewItemRepository extends TenantScopedRepository<ReviewItem, UUID> {

    Page<ReviewItem> findByTenantIdAndStatus(UUID tenantId, ValidationStatus status, Pageable pageable);

    Optional<ReviewItem> findByExtractedFactIdAndTenantId(UUID extractedFactId, UUID tenantId);
}
