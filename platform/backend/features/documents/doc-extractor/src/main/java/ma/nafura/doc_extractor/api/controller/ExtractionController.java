package ma.nafura.platform.documents.docextractor.api.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.nafura.platform.documents.docextractor.domain.model.DocTypeDefinition;
import ma.nafura.platform.documents.docextractor.domain.model.ExtractionRequest;
import ma.nafura.platform.documents.docextractor.domain.model.ExtractionResponse;
import ma.nafura.platform.documents.docextractor.service.DocTypeDefinitionService;
import ma.nafura.platform.documents.docextractor.service.ExtractionFlowService;
import ma.nafura.platform.documents.docextractor.service.ExtractionService;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * Legacy extraction endpoints used by the ERP web app (Scanner BL, doc-extractor workspace).
 */
@Slf4j
@RestController
@RequestMapping("/api/extractions")
@RequiredArgsConstructor
public class ExtractionController {

    private static final int EXTRACTION_TIMEOUT_SECONDS = 120;

    private final DocTypeDefinitionService docTypeDefinitionService;
    private final ExtractionService extractionService;
    private final ExtractionFlowService extractionFlowService;

    @PostMapping(value = "/extract", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ExtractionResponse extract(
            @RequestParam("file") MultipartFile file,
            @RequestParam("docTypeDefinitionId") UUID docTypeDefinitionId,
            @RequestParam(value = "persist", defaultValue = "false") boolean persist
    ) throws Exception {
        UUID tenantId = TenantContext.getTenantId();
        DocTypeDefinition docTypeDefinition = docTypeDefinitionService.getById(docTypeDefinitionId);

        byte[] fileBytes = file.getBytes();
        String mimeType = file.getContentType();
        String fileName = file.getOriginalFilename();

        if (persist) {
            return extractionFlowService.processExtraction(
                    fileBytes,
                    fileName,
                    mimeType,
                    docTypeDefinition,
                    tenantId,
                    null,
                    true
            );
        }

        return extractEphemeral(fileBytes, mimeType, docTypeDefinition, tenantId);
    }

    private ExtractionResponse extractEphemeral(
            byte[] fileBytes,
            String mimeType,
            DocTypeDefinition docTypeDefinition,
            UUID tenantId
    ) throws Exception {
        String safeMimeType = (mimeType == null || mimeType.isBlank())
                ? "application/octet-stream"
                : mimeType;

        ExtractionRequest request = new ExtractionRequest();
        request.setMimeType(safeMimeType);
        request.setContentBase64(Base64.getEncoder().encodeToString(fileBytes));

        Map<String, Object> metadata = new HashMap<>();
        metadata.put("tenantId", tenantId.toString());
        request.setMetadata(metadata);

        ExtractionResponse response = new ExtractionResponse();
        try {
            ExtractionResponse llmResponse = extractionService
                    .extractWithDocTypeDefinition(
                            request,
                            docTypeDefinition,
                            tenantId.toString(),
                            null
                    )
                    .get(EXTRACTION_TIMEOUT_SECONDS, TimeUnit.SECONDS);

            response.setExtractedJson(llmResponse.getExtractedJson());
            response.setRequestId(llmResponse.getRequestId());
            response.setTenantId(llmResponse.getTenantId());
            response.setProvider(llmResponse.getProvider());
            response.setModel(llmResponse.getModel());
            response.setCostUsd(llmResponse.getCostUsd());
            response.setCreatedAt(llmResponse.getCreatedAt());
            response.setStatus("COMPLETED");
        } catch (java.util.concurrent.TimeoutException e) {
            log.error("Ephemeral extraction timed out for docType {}:{}", docTypeDefinition.getDomainKey(), docTypeDefinition.getDocTypeKey());
            response.setStatus("FAILED");
            response.setError("Extraction timed out after " + EXTRACTION_TIMEOUT_SECONDS + " seconds");
        } catch (java.util.concurrent.ExecutionException e) {
            log.error("Ephemeral extraction failed: {}", e.getCause() != null ? e.getCause().getMessage() : e.getMessage());
            response.setStatus("FAILED");
            response.setError("Extraction failed: " + (e.getCause() != null ? e.getCause().getMessage() : e.getMessage()));
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            response.setStatus("FAILED");
            response.setError("Extraction was interrupted");
        }
        return response;
    }
}
