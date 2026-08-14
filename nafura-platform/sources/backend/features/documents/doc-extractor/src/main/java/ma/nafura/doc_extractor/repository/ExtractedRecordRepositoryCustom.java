package ma.nafura.platform.documents.docextractor.repository;

import ma.nafura.platform.documents.docextractor.domain.model.ExtractedRecord;
import ma.nafura.platform.documents.docextractor.api.request.RecordSearchRequest;

import java.util.List;
import java.util.UUID;

/**
 * Custom repository interface for advanced search operations.
 */
public interface ExtractedRecordRepositoryCustom {
    
    /**
     * Search records with filters, pagination, and sorting.
     * 
     * @param tenantId Tenant ID (mandatory for security)
     * @param request Search request with context, filters, pagination, and sort
     * @return List of matching records
     */
    List<ExtractedRecord> searchRecords(UUID tenantId, RecordSearchRequest request);
    
    /**
     * Count records matching the search criteria (for pagination).
     * 
     * @param tenantId Tenant ID (mandatory for security)
     * @param request Search request with context and filters (pagination/sort ignored)
     * @return Total count of matching records
     */
    long countRecords(UUID tenantId, RecordSearchRequest request);
}

