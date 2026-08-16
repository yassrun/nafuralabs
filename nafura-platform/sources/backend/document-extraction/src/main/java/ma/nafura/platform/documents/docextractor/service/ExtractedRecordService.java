package ma.nafura.platform.documents.docextractor.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.nafura.platform.documents.docextractor.domain.model.ExtractedRecord;
import ma.nafura.platform.documents.docextractor.repository.ExtractedRecordRepository;
import ma.nafura.platform.documents.docextractor.domain.model.workflow.DocumentWorkflowStatus;
import ma.nafura.platform.documents.docextractor.domain.model.workflow.ValidationState;
import ma.nafura.platform.documents.docextractor.domain.model.workflow.CompletenessState;
import ma.nafura.platform.documents.docextractor.api.response.ExtractedRecordDto;
import ma.nafura.platform.documents.docextractor.api.request.RecordSearchRequest;
import ma.nafura.platform.documents.docextractor.api.response.RecordSearchResponse;
import ma.nafura.platform.framework.service.crud.CrudNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExtractedRecordService {

    private final ExtractedRecordRepository repository;

    /**
     * Save or update an extracted record.
     * If recordId is provided and exists, updates it; otherwise creates a new record.
     * New records are created as DRAFT by default (auto-save after import/scan).
     */
    @Transactional
    public ExtractedRecordDto saveOrUpdate(
            UUID tenantId,
            String recordId,
            String domainKey,
            String docTypeKey,
            Integer docTypeVersion,
            java.util.Map<String, Object> dataJson) {
        return saveOrUpdate(tenantId, recordId, domainKey, docTypeKey, docTypeVersion, dataJson, DocumentWorkflowStatus.DRAFT);
    }


    /**
     * Save or update an extracted record with workflow status.
     * Used for auto-save (DRAFT) and workflow transitions.
     */
    @Transactional
    public ExtractedRecordDto saveOrUpdate(
            UUID tenantId,
            String recordId,
            String domainKey,
            String docTypeKey,
            Integer docTypeVersion,
            java.util.Map<String, Object> dataJson,
            DocumentWorkflowStatus workflowStatus) {
        return saveOrUpdate(tenantId, recordId, domainKey, docTypeKey, docTypeVersion, null, dataJson, workflowStatus);
    }

    /**
     * Save or update an extracted record with full workflow state.
     * Used for auto-save with validation/completeness states.
     */
    @Transactional
    public ExtractedRecordDto saveOrUpdate(
            UUID tenantId,
            String recordId,
            String domainKey,
            String docTypeKey,
            Integer docTypeVersion,
            UUID docTypeDefinitionId,
            java.util.Map<String, Object> dataJson,
            DocumentWorkflowStatus workflowStatus) {

        ExtractedRecord record;
        
        if (recordId != null) {
            // Try to find existing record by recordId and tenantId
            record = repository.findByRecordIdAndTenantId(recordId, tenantId)
                    .orElse(null);
        } else {
            record = null;
        }

        if (record == null) {
            // Create new record (auto-saved as DRAFT after import/scan)
            if (recordId == null) {
                recordId = UUID.randomUUID().toString();
            }
            // Generate a unique placeholder sha256 for records created without a file
            // This ensures the NOT NULL constraint is satisfied while still being unique per tenant
            String placeholderSha256 = generatePlaceholderSha256(recordId);
            
            record = ExtractedRecord.builder()
                    .tenantId(tenantId)
                    .recordId(recordId)
                    .domainKey(domainKey)
                    .docTypeKey(docTypeKey)
                    .docTypeVersion(docTypeVersion)
                    .docTypeDefinitionId(docTypeDefinitionId)
                    .dataJson(dataJson != null ? dataJson : new java.util.HashMap<>())
                    .workflowStatus(workflowStatus != null ? workflowStatus : DocumentWorkflowStatus.DRAFT)
                    .status("draft") // Legacy field, kept for backward compatibility
                    .sha256(placeholderSha256)
                    .build();
        } else {
            // Update existing record (auto-save updates data and workflow state)
            record.setDomainKey(domainKey);
            record.setDocTypeKey(docTypeKey);
            record.setDocTypeVersion(docTypeVersion);
            if (docTypeDefinitionId != null) {
                record.setDocTypeDefinitionId(docTypeDefinitionId);
            }
            record.setDataJson(dataJson != null ? dataJson : new java.util.HashMap<>());
            if (workflowStatus != null) {
                record.setWorkflowStatus(workflowStatus);
                // Update legacy status for backward compatibility
                record.setStatus(workflowStatus.name().toLowerCase());
            }
        }

        ExtractedRecord saved = repository.save(record);
        log.info("Saved extracted record {} for tenant {} with status {}", 
                saved.getRecordId(), tenantId, saved.getWorkflowStatus());

        return toDto(saved);
    }

    /**
     * Get all records for a session (domain + docType + version) within a tenant.
     */
    @Transactional(readOnly = true)
    public List<ExtractedRecordDto> getSessionRecords(
            UUID tenantId,
            String domainKey,
            String docTypeKey,
            Integer docTypeVersion) {

        List<ExtractedRecord> records = repository
                .findByTenantIdAndDomainKeyAndDocTypeKeyAndDocTypeVersionOrderByCreatedAtDesc(
                        tenantId, domainKey, docTypeKey, docTypeVersion);

        return records.stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Get a record by recordId (with tenant check for security).
     */
    @Transactional(readOnly = true)
    public ExtractedRecordDto getRecord(String recordId, UUID tenantId) {
        ExtractedRecord record = repository.findByRecordIdAndTenantId(recordId, tenantId)
            .orElseThrow(() -> new CrudNotFoundException(
                "ExtractedRecord not found: " + recordId + " for tenant: " + tenantId));

        return toDto(record);
    }

    /**
     * Get all records for a tenant.
     */
    @Transactional(readOnly = true)
    public List<ExtractedRecordDto> getTenantRecords(UUID tenantId) {
        List<ExtractedRecord> records = repository.findByTenantIdOrderByCreatedAtDesc(tenantId);
        return records.stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /**
     * List extraction "documents" for the Doc Extractor Documents page.
     * This is based on ExtractedRecord (not MinIO documents), with optional filters.
     */
    @Transactional(readOnly = true)
    public Page<ExtractedRecord> listDocuments(
            UUID tenantId,
            String domainKey,
            String docTypeKey,
            DocumentWorkflowStatus workflowStatus,
            Pageable pageable) {
        return repository.findDocuments(tenantId, domainKey, docTypeKey, workflowStatus, pageable);
    }

    /**
     * Search records with filters, pagination, and sorting.
     * 
     * @param tenantId Tenant ID (mandatory for security)
     * @param request Search request with context, filters, pagination, and sort
     * @return Search response with paginated records and metadata
     */
    @Transactional(readOnly = true)
    public RecordSearchResponse searchRecords(UUID tenantId, RecordSearchRequest request) {
        // Search records
        List<ExtractedRecord> records = repository.searchRecords(tenantId, request);
        
        // Count total matching records (for pagination)
        long totalItems = repository.countRecords(tenantId, request);
        
        // Convert to DTOs
        List<ExtractedRecordDto> items = records.stream()
                .map(this::toDto)
                .collect(Collectors.toList());
        
        // Build pagination info
        int pageIndex = request.getPage() != null && request.getPage().getIndex() != null 
                ? request.getPage().getIndex() : 0;
        int pageSize = request.getPage() != null && request.getPage().getSize() != null 
                ? request.getPage().getSize() : 20;
        int totalPages = (int) Math.ceil((double) totalItems / pageSize);
        
        RecordSearchResponse.PageInfo pageInfo = RecordSearchResponse.PageInfo.builder()
                .index(pageIndex)
                .size(pageSize)
                .totalItems(totalItems)
                .totalPages(totalPages)
                .build();
        
        return RecordSearchResponse.builder()
                .items(items)
                .page(pageInfo)
                .build();
    }

    /**
     * Auto-save draft with validation and completeness states.
     * This is the method to use for auto-save after field changes.
     * Updates the record's data and secondary states without changing workflow status.
     */
    @Transactional
    public ExtractedRecordDto autoSaveDraft(
            UUID tenantId,
            String recordId,
            String domainKey,
            String docTypeKey,
            Integer docTypeVersion,
            UUID docTypeDefinitionId,
            java.util.Map<String, Object> dataJson,
            ValidationState validationState,
            CompletenessState completenessState,
            Integer errorCount) {

        ExtractedRecord record = repository.findByRecordIdAndTenantId(recordId, tenantId)
            .orElseThrow(() -> new CrudNotFoundException(
                "ExtractedRecord not found: " + recordId + " for tenant: " + tenantId));

        // Auto-save only applies to DRAFT documents
        if (record.getWorkflowStatus() != DocumentWorkflowStatus.DRAFT) {
            throw new IllegalArgumentException(
                    "Auto-save only applies to DRAFT documents. Current status: " + record.getWorkflowStatus());
        }

        // Update data and secondary states
        record.setDomainKey(domainKey);
        record.setDocTypeKey(docTypeKey);
        record.setDocTypeVersion(docTypeVersion);
        if (docTypeDefinitionId != null) {
            record.setDocTypeDefinitionId(docTypeDefinitionId);
        }
        record.setDataJson(dataJson != null ? dataJson : new java.util.HashMap<>());
        record.setValidationState(validationState);
        record.setCompletenessState(completenessState);
        record.setErrorCount(errorCount);
        // Workflow status remains DRAFT (no change)

        ExtractedRecord saved = repository.save(record);
        log.debug("Auto-saved draft record {} for tenant {}", saved.getRecordId(), tenantId);

        return toDto(saved);
    }

    /**
     * Delete a record by recordId (with tenant check for security).
     * 
     * @param recordId The record ID to delete
     * @param tenantId The tenant ID for security verification
     * @throws IllegalArgumentException if record not found or doesn't belong to tenant
     */
    @Transactional
    public void deleteRecord(String recordId, UUID tenantId) {
        ExtractedRecord record = repository.findByRecordIdAndTenantId(recordId, tenantId)
            .orElseThrow(() -> new CrudNotFoundException(
                "ExtractedRecord not found: " + recordId + " for tenant: " + tenantId));
        
        repository.delete(record);
        log.info("Deleted extracted record {} for tenant {}", recordId, tenantId);
    }

    /**
     * Delete multiple records by recordIds (with tenant check for security).
     * 
     * @param recordIds List of record IDs to delete
     * @param tenantId The tenant ID for security verification
     * @return Number of records deleted
     */
    @Transactional
    public int deleteRecords(List<String> recordIds, UUID tenantId) {
        int deletedCount = 0;
        for (String recordId : recordIds) {
            try {
                deleteRecord(recordId, tenantId);
                deletedCount++;
            } catch (IllegalArgumentException e) {
                log.warn("Failed to delete record {}: {}", recordId, e.getMessage());
            }
        }
        return deletedCount;
    }

    /**
     * Convert entity to DTO.
     */
    private ExtractedRecordDto toDto(ExtractedRecord record) {
        return ExtractedRecordDto.builder()
                .recordId(record.getRecordId())
                .domainKey(record.getDomainKey())
                .docTypeKey(record.getDocTypeKey())
                .docTypeVersion(record.getDocTypeVersion())
                .docTypeDefinitionId(record.getDocTypeDefinitionId())
                .dataJson(record.getDataJson())
                .status(record.getStatus()) // Legacy field for backward compatibility
                .workflowStatus(record.getWorkflowStatus())
                .validationState(record.getValidationState())
                .completenessState(record.getCompletenessState())
                .errorCount(record.getErrorCount())
                .rejectionReason(record.getRejectionReason())
                .storedDocumentId(record.getStoredDocumentId())
                .sourceFileName(record.getSourceFileName())
                .sourceMimeType(record.getSourceMimeType())
                .sourceFileSizeBytes(record.getSourceFileSizeBytes())
                .createdAt(record.getCreatedAt())
                .build();
    }

    /**
     * Generate a unique placeholder SHA256 for records created without a file.
     * Uses the recordId to ensure uniqueness within the tenant.
     * Format: "manual_" prefix + SHA256 hash of recordId (truncated to 64 chars total)
     */
    private String generatePlaceholderSha256(String recordId) {
        try {
            java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(("manual_record_" + recordId).getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (java.security.NoSuchAlgorithmException e) {
            // Fallback: use recordId directly (should never happen as SHA-256 is standard)
            log.warn("SHA-256 algorithm not available, using fallback for placeholder hash");
            return "manual_" + recordId.replace("-", "").substring(0, Math.min(recordId.length(), 57));
        }
    }
}


