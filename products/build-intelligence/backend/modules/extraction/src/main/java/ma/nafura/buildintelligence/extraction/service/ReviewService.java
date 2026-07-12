package ma.nafura.buildintelligence.extraction.service;

import lombok.RequiredArgsConstructor;
import ma.nafura.buildintelligence.catalog.domain.WorkItem;
import ma.nafura.buildintelligence.catalog.service.CatalogService;
import ma.nafura.buildintelligence.retrieval.service.HybridSearchService;
import ma.nafura.buildintelligence.extraction.domain.ExtractedFact;
import ma.nafura.buildintelligence.extraction.domain.ReviewItem;
import ma.nafura.buildintelligence.extraction.domain.ValidationStatus;
import ma.nafura.buildintelligence.extraction.repository.ExtractedFactRepository;
import ma.nafura.buildintelligence.extraction.repository.ReviewItemRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewItemRepository reviewItemRepository;
    private final ExtractedFactRepository extractedFactRepository;
    private final CatalogService catalogService;
    private final HybridSearchService hybridSearchService;

    @Transactional(readOnly = true)
    public Page<ReviewItem> listPending(Pageable pageable) {
        return reviewItemRepository.findByTenantIdAndStatus(
                TenantContext.getTenantId(), ValidationStatus.PENDING_REVIEW, pageable);
    }

    @Transactional(readOnly = true)
    public ReviewItem get(UUID id) {
        return reviewItemRepository.findByIdAndTenantId(id, TenantContext.getTenantId())
                .orElseThrow(() -> new IllegalArgumentException("Review item not found"));
    }

    @Transactional
    public ReviewItem validate(UUID id, String reviewerSub) {
        return decide(id, reviewerSub, ValidationStatus.VALIDATED, null);
    }

    @Transactional
    public ReviewItem reject(UUID id, String reviewerSub) {
        return decide(id, reviewerSub, ValidationStatus.REJECTED, null);
    }

    @Transactional
    public ReviewItem correct(UUID id, String reviewerSub, Map<String, Object> correction) {
        return decide(id, reviewerSub, ValidationStatus.CORRECTED, correction);
    }

    private ReviewItem decide(UUID id, String reviewerSub, ValidationStatus status, Map<String, Object> correction) {
        UUID tenantId = TenantContext.getTenantId();
        ReviewItem item = reviewItemRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Review item not found"));
        ExtractedFact fact = extractedFactRepository.findByIdAndTenantId(item.getExtractedFactId(), tenantId)
                .orElseThrow();

        item.setStatus(status);
        item.setReviewerSub(reviewerSub);
        item.setReviewedAt(OffsetDateTime.now());
        item.setCorrection(correction);
        reviewItemRepository.save(item);

        fact.setValidationStatus(status);
        if (correction != null && !correction.isEmpty()) {
            fact.getPayload().putAll(correction);
        }
        extractedFactRepository.save(fact);

        if (status == ValidationStatus.VALIDATED || status == ValidationStatus.CORRECTED) {
            WorkItem workItem = catalogService.upsertFromPayload(fact.getPayload());
            catalogService.recordPriceObservation(workItem, fact.getPayload(), fact.getConfidence(), fact.getId());
            Object documentId = fact.getEvidence() != null ? fact.getEvidence().get("documentId") : null;
            if (documentId != null) {
                hybridSearchService.indexDocument(
                        UUID.fromString(documentId.toString()),
                        List.of(workItem.getDesignation())
                );
            }
        }
        return item;
    }
}
