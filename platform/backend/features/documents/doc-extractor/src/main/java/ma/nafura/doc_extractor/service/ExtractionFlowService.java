package ma.nafura.platform.documents.docextractor.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.nafura.platform.documents.docextractor.domain.model.DocTypeDefinition;
import ma.nafura.platform.documents.docextractor.domain.model.ExtractionRequest;
import ma.nafura.platform.documents.docextractor.domain.model.ExtractionResponse;
import ma.nafura.platform.documents.docextractor.domain.model.ExtractedRecord;
import ma.nafura.platform.documents.docextractor.repository.ExtractedRecordRepository;
import ma.nafura.platform.collaboration.docmanager.domain.enums.DocumentType;
import ma.nafura.platform.collaboration.docmanager.service.DocumentService;
import ma.nafura.platform.documents.docextractor.api.response.DedupDto;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExtractionFlowService {

    private final ExtractionService extractionService;
    private final DocumentService documentService;
    private final HashService hashService;
    private final DedupService dedupService;
    private final ExtractedRecordRepository recordRepository;

    public ExtractionResponse processExtraction(
            byte[] fileBytes,
            String fileName,
            String mimeType,
            DocTypeDefinition docTypeDefinition,
            UUID tenantId,
            String recordId,
            boolean storeInMinio) {

        // 1. Compute SHA-256
        String sha256 = hashService.sha256(fileBytes);

        // Normalize source file metadata (persisted even if storeInMinio=false)
        final String safeMimeType = (mimeType == null || mimeType.isBlank()) ? "application/octet-stream" : mimeType;
        final String normalizedFileName = normalizeFileName(fileName, safeMimeType, recordId);
        final long fileSizeBytes = fileBytes != null ? fileBytes.length : 0L;

        // 2. Try to INSERT a new extracted_record row immediately (concurrency-safe)
        ExtractedRecord record;
        try {
            record = ExtractedRecord.builder()
                    .tenantId(tenantId)
                    .recordId(recordId != null ? recordId : UUID.randomUUID().toString())
                    .domainKey(docTypeDefinition.getDomainKey())
                    .docTypeKey(docTypeDefinition.getDocTypeKey())
                    .docTypeVersion(docTypeDefinition.getVersion())
                    .docTypeDefinitionId(docTypeDefinition.getId())
                    .sourceFileName(normalizedFileName)
                    .sourceMimeType(safeMimeType)
                    .sourceFileSizeBytes(fileSizeBytes)
                    .sha256(sha256)
                    .workflowStatus(ma.nafura.platform.documents.docextractor.domain.model.workflow.DocumentWorkflowStatus.IN_PROGRESS)
                    .dataJson(new HashMap<>())
                    .build();
            record = recordRepository.saveAndFlush(record);
        } catch (DataIntegrityViolationException e) {
            // 3. If insert fails due to unique constraint, fetch existing record
            Optional<ExtractedRecord> existing = dedupService.findExactDuplicate(tenantId, sha256);
            if (existing.isPresent()) {
                ExtractedRecord existingRecord = existing.get();
                ExtractionResponse response = new ExtractionResponse();
                response.setRecordId(existingRecord.getRecordId());
                response.setStatus("DUPLICATE");
                
                DedupDto dedupDto = DedupDto.builder()
                    .exactDuplicate(DedupDto.ExactDuplicateDto.builder()
                        .isDuplicate(true)
                        .existingRecordId(existingRecord.getRecordId())
                        .existingStatus(existingRecord.getWorkflowStatus().name())
                        .build())
                    .build();
                response.setDedup(dedupDto);
                return response;
            }
            throw e;
        }

        // 4. Compute phash best-effort
        Long phash = hashService.phash(fileBytes);
        record.setPhash(phash);
        recordRepository.save(record);

        // 5. Run near-duplicate scan (excluding the current record we just saved)
        DedupService.DedupResult.NearMatch nearMatch = dedupService.findNearDuplicate(tenantId, phash, record.getRecordId());
        
        DedupDto dedupDto = DedupDto.builder()
                .exactDuplicate(DedupDto.ExactDuplicateDto.builder()
                        .isDuplicate(false)
                        .build())
                .nearDuplicate(DedupDto.NearDuplicateDto.builder()
                        .isNearDuplicate(nearMatch.isDuplicate())
                        .candidateRecordId(nearMatch.getCandidateRecordId())
                        .distance(nearMatch.getDistance())
                        .build())
                .build();

        // 6. Optional MinIO storage (BEFORE expensive Gemini call, as requested, but AFTER DDOP)
        if (storeInMinio) {
            try {
                ma.nafura.platform.collaboration.docmanager.domain.model.Document doc = documentService.uploadDocument(
                    tenantId,
                    fileBytes,
                    normalizedFileName,
                    safeMimeType,
                    DocumentType.OTHER,
                    OffsetDateTime.now(),
                    null // or pass userId if available
                );
                record.setStoredDocumentId(doc.getId());
                recordRepository.save(record);
                log.info("Stored document in MinIO for record {}: documentId={}", record.getRecordId(), doc.getId());
            } catch (Exception e) {
                log.error("Failed to store in MinIO for record {}: {}", record.getRecordId(), e.getMessage());
            }
        }

        // 7. Prepare extraction request
        String contentBase64 = Base64.getEncoder().encodeToString(fileBytes);
        ExtractionRequest extractionRequest = new ExtractionRequest();
        extractionRequest.setMimeType(safeMimeType);
        extractionRequest.setContentBase64(contentBase64);
        
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("tenantId", tenantId.toString());
        metadata.put("recordId", record.getRecordId());
        extractionRequest.setMetadata(metadata);

        // 8. Execute extraction synchronously (wait for LLM response)
        ExtractionResponse response = new ExtractionResponse();
        response.setRecordId(record.getRecordId());
        response.setDedup(dedupDto);

        final UUID internalRecordId = record.getId();
        final String recordIdString = record.getRecordId();

        try {
            // Wait for extraction to complete (with timeout)
            var llmResponse = extractionService.extractWithDocTypeDefinition(
                    extractionRequest, docTypeDefinition, tenantId.toString(), null)
                    .get(120, java.util.concurrent.TimeUnit.SECONDS);

            // Update the record with extracted data
            updateRecordWithResult(internalRecordId, llmResponse.getExtractedJson());

            // Set successful response
            response.setStatus("COMPLETED");
            response.setExtractedJson(llmResponse.getExtractedJson());
            log.info("Extraction completed successfully for record {}", recordIdString);

        } catch (java.util.concurrent.TimeoutException e) {
            log.error("Extraction timed out for record {}", recordIdString);
            response.setStatus("FAILED");
            response.setError("Extraction timed out after 120 seconds");
            // Mark record as failed
            markRecordAsFailed(internalRecordId, "Extraction timeout");
        } catch (java.util.concurrent.ExecutionException e) {
            log.error("Extraction failed for record {}: {}", recordIdString, e.getCause().getMessage());
            response.setStatus("FAILED");
            response.setError("Extraction failed: " + e.getCause().getMessage());
            // Mark record as failed
            markRecordAsFailed(internalRecordId, e.getCause().getMessage());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.error("Extraction interrupted for record {}", recordIdString);
            response.setStatus("FAILED");
            response.setError("Extraction was interrupted");
            markRecordAsFailed(internalRecordId, "Extraction interrupted");
        }

        return response;
    }

    @Transactional
    public void updateRecordWithResult(UUID id, String json) {
        ExtractedRecord r = recordRepository.findById(id).orElseThrow();
        try {
            Map<String, Object> data = new com.fasterxml.jackson.databind.ObjectMapper().readValue(
                json, new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>() {});
            r.setDataJson(data);
            r.setWorkflowStatus(ma.nafura.platform.documents.docextractor.domain.model.workflow.DocumentWorkflowStatus.DRAFT);
            // Keep legacy status in sync so UI datatable can display/filter correctly
            r.setStatus("draft");
            recordRepository.save(r);
            log.info("Record {} updated with extracted data", r.getRecordId());
        } catch (Exception e) {
            log.error("Failed to parse extracted JSON for record {}: {}", r.getRecordId(), e.getMessage());
            // Mark as rejected if JSON parsing fails
            r.setWorkflowStatus(ma.nafura.platform.documents.docextractor.domain.model.workflow.DocumentWorkflowStatus.REJECTED);
            recordRepository.save(r);
        }
    }

    @Transactional
    public void markRecordAsFailed(UUID id, String errorMessage) {
        recordRepository.findById(id).ifPresent(r -> {
            r.setWorkflowStatus(ma.nafura.platform.documents.docextractor.domain.model.workflow.DocumentWorkflowStatus.REJECTED);
            recordRepository.save(r);
            log.info("Record {} marked as REJECTED due to: {}", r.getRecordId(), errorMessage);
        });
    }

    /**
     * Normalize file name for display/storage:
     * - strips any path
     * - replaces unsafe characters
     * - preserves extension when possible
     * - falls back to recordId + extension derived from mime type
     */
    private String normalizeFileName(String original, String mimeType, String recordId) {
        String base = original;
        if (base == null || base.isBlank()) {
            base = recordId != null ? recordId : UUID.randomUUID().toString();
        }

        // Remove any path segments
        base = base.replace("\\", "/");
        int lastSlash = base.lastIndexOf('/');
        if (lastSlash >= 0) {
            base = base.substring(lastSlash + 1);
        }

        // Basic sanitize
        base = base.trim();
        base = base.replaceAll("[\\r\\n\\t]", " ");
        base = base.replaceAll("[^a-zA-Z0-9._()\\- ]+", "_");
        base = base.replaceAll("\\s+", "_");
        base = base.replaceAll("_+", "_");

        // Enforce max length
        if (base.length() > 120) {
            String ext = "";
            int dot = base.lastIndexOf('.');
            if (dot > 0 && dot < base.length() - 1) {
                ext = base.substring(dot);
                base = base.substring(0, dot);
            }
            base = base.substring(0, Math.min(base.length(), 120 - ext.length())) + ext;
        }

        // Ensure extension exists for common mime types
        if (!base.contains(".")) {
            base = base + extensionForMime(mimeType);
        }
        return base;
    }

    private String extensionForMime(String mimeType) {
        if (mimeType == null) return "";
        String mt = mimeType.toLowerCase();
        if (mt.contains("pdf")) return ".pdf";
        if (mt.contains("png")) return ".png";
        if (mt.contains("jpeg") || mt.contains("jpg")) return ".jpg";
        if (mt.contains("webp")) return ".webp";
        return "";
    }
}


