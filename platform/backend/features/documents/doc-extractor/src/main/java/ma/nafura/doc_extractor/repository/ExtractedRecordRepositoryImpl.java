package ma.nafura.platform.documents.docextractor.repository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import jakarta.persistence.criteria.*;
import lombok.extern.slf4j.Slf4j;
import ma.nafura.platform.documents.docextractor.domain.model.ExtractedRecord;
import ma.nafura.platform.documents.docextractor.api.request.RecordSearchRequest;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Custom repository implementation using JPA Criteria API for dynamic queries.
 */
@Slf4j
@Repository
public class ExtractedRecordRepositoryImpl implements ExtractedRecordRepositoryCustom {

    @PersistenceContext
    private EntityManager entityManager;

    private static final DateTimeFormatter ISO_DATE_TIME_FORMATTER = 
        DateTimeFormatter.ISO_OFFSET_DATE_TIME;

    @Override
    public List<ExtractedRecord> searchRecords(UUID tenantId, RecordSearchRequest request) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<ExtractedRecord> query = cb.createQuery(ExtractedRecord.class);
        Root<ExtractedRecord> root = query.from(ExtractedRecord.class);

        // Build WHERE clause
        List<Predicate> predicates = buildPredicates(cb, root, tenantId, request);

        query.where(predicates.toArray(new Predicate[0]));

        // Apply sorting
        if (request.getSort() != null && !request.getSort().isEmpty()) {
            List<Order> orders = new ArrayList<>();
            for (RecordSearchRequest.SortRequest sortReq : request.getSort()) {
                Path<?> sortPath = getSortPath(root, sortReq.getField());
                if (sortReq.getDir() != null && sortReq.getDir().equalsIgnoreCase("DESC")) {
                    orders.add(cb.desc(sortPath));
                } else {
                    orders.add(cb.asc(sortPath));
                }
            }
            query.orderBy(orders);
        } else {
            // Default sort by createdAt DESC
            query.orderBy(cb.desc(root.get("createdAt")));
        }

        TypedQuery<ExtractedRecord> typedQuery = entityManager.createQuery(query);

        // Apply pagination
        if (request.getPage() != null) {
            int pageIndex = request.getPage().getIndex() != null ? request.getPage().getIndex() : 0;
            int pageSize = request.getPage().getSize() != null ? request.getPage().getSize() : 20;
            typedQuery.setFirstResult(pageIndex * pageSize);
            typedQuery.setMaxResults(pageSize);
        }

        return typedQuery.getResultList();
    }

    @Override
    public long countRecords(UUID tenantId, RecordSearchRequest request) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<Long> query = cb.createQuery(Long.class);
        Root<ExtractedRecord> root = query.from(ExtractedRecord.class);

        query.select(cb.count(root));

        // Build WHERE clause (same as search)
        List<Predicate> predicates = buildPredicates(cb, root, tenantId, request);
        query.where(predicates.toArray(new Predicate[0]));

        return entityManager.createQuery(query).getSingleResult();
    }

    /**
     * Build WHERE clause predicates from request.
     */
    private List<Predicate> buildPredicates(
            CriteriaBuilder cb,
            Root<ExtractedRecord> root,
            UUID tenantId,
            RecordSearchRequest request) {
        
        List<Predicate> predicates = new ArrayList<>();

        // Mandatory: tenant scoping
        predicates.add(cb.equal(root.get("tenantId"), tenantId));

        // Context filters (domainKey, docTypeKey, version)
        if (request.getContext() != null) {
            RecordSearchRequest.Context ctx = request.getContext();
            if (ctx.getDomainKey() != null && !ctx.getDomainKey().isEmpty()) {
                predicates.add(cb.equal(root.get("domainKey"), ctx.getDomainKey()));
            }
            if (ctx.getDocTypeKey() != null && !ctx.getDocTypeKey().isEmpty()) {
                predicates.add(cb.equal(root.get("docTypeKey"), ctx.getDocTypeKey()));
            }
            if (ctx.getVersion() != null) {
                predicates.add(cb.equal(root.get("docTypeVersion"), ctx.getVersion()));
            }
        }

        // Status filter
        if (request.getFilters() != null && request.getFilters().getStatus() != null 
                && !request.getFilters().getStatus().isEmpty()) {
            predicates.add(cb.equal(
                cb.lower(root.get("status")), 
                request.getFilters().getStatus().toLowerCase()
            ));
        }

        // Date range filter
        if (request.getFilters() != null) {
            RecordSearchRequest.Filters filters = request.getFilters();
            String dateField = filters.getDateField();
            if (dateField == null || dateField.isEmpty()) {
                dateField = "CREATED_AT"; // default
            }

            Path<OffsetDateTime> datePath;
            if ("EXTRACTED_AT".equalsIgnoreCase(dateField)) {
                // Note: extractedAt doesn't exist yet, using createdAt as fallback
                // This can be updated when extractedAt field is added
                datePath = root.get("createdAt");
            } else {
                datePath = root.get("createdAt");
            }

            if (filters.getDateFrom() != null && !filters.getDateFrom().isEmpty()) {
                try {
                    OffsetDateTime dateFrom = OffsetDateTime.parse(filters.getDateFrom(), ISO_DATE_TIME_FORMATTER);
                    predicates.add(cb.greaterThanOrEqualTo(datePath, dateFrom));
                } catch (Exception e) {
                    log.warn("Invalid dateFrom format: {}", filters.getDateFrom(), e);
                }
            }

            if (filters.getDateTo() != null && !filters.getDateTo().isEmpty()) {
                try {
                    OffsetDateTime dateTo = OffsetDateTime.parse(filters.getDateTo(), ISO_DATE_TIME_FORMATTER);
                    // For inclusive end date, add 1 day and use < instead of <=
                    // Or use end of day: set time to 23:59:59.999
                    OffsetDateTime dateToEndOfDay = dateTo.toLocalDate()
                        .atTime(23, 59, 59, 999_000_000)
                        .atOffset(dateTo.getOffset());
                    predicates.add(cb.lessThanOrEqualTo(datePath, dateToEndOfDay));
                } catch (Exception e) {
                    log.warn("Invalid dateTo format: {}", filters.getDateTo(), e);
                }
            }
        }

        return predicates;
    }

    /**
     * Get sort path for a field name.
     */
    private Path<?> getSortPath(Root<ExtractedRecord> root, String field) {
        // Map field names to entity paths
        switch (field != null ? field.toUpperCase() : "") {
            case "CREATED_AT":
            case "CREATEDAT":
                return root.get("createdAt");
            case "UPDATED_AT":
            case "UPDATEDAT":
                return root.get("updatedAt");
            case "STATUS":
                return root.get("status");
            case "RECORD_ID":
            case "RECORDID":
                return root.get("recordId");
            default:
                // Default to createdAt
                return root.get("createdAt");
        }
    }
}

