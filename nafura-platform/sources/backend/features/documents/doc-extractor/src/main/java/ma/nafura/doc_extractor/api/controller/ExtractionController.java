package ma.nafura.platform.documents.docextractor.api.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.nafura.platform.documents.docextractor.domain.model.DocTypeDefinition;
import ma.nafura.platform.documents.docextractor.domain.model.ExtractionFailure;
import ma.nafura.platform.documents.docextractor.domain.model.ExtractionRequest;
import ma.nafura.platform.documents.docextractor.domain.model.ExtractionResponse;
import ma.nafura.platform.documents.docextractor.service.DocTypeDefinitionService;
import ma.nafura.platform.documents.docextractor.service.ExtractionFlowService;
import ma.nafura.platform.documents.docextractor.service.ExtractionService;
import ma.nafura.platform.documents.docextractor.service.SchemaValidator;
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
import java.util.Set;
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
    private static final long MAX_FILE_SIZE_BYTES = 15L * 1024L * 1024L;
    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            "application/pdf",
            "text/csv",
            "application/csv",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "image/png",
            "image/jpeg",
            "image/webp",
            "image/tiff"
    );

    private final DocTypeDefinitionService docTypeDefinitionService;
    private final ExtractionService extractionService;
    private final ExtractionFlowService extractionFlowService;
    private final SchemaValidator schemaValidator;

    @PostMapping(value = "/extract", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ExtractionResponse extract(
            @RequestParam("file") MultipartFile file,
            @RequestParam("docTypeDefinitionId") UUID docTypeDefinitionId,
            @RequestParam(value = "persist", defaultValue = "false") boolean persist
    ) throws Exception {
        validateFile(file);
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

    private void validateFile(MultipartFile file) {
        if (file.isEmpty() || file.getSize() == 0) {
            throw new IllegalArgumentException("FILE_EMPTY");
        }
        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new IllegalArgumentException("FILE_TOO_LARGE");
        }
        String mimeType = file.getContentType();
        if (mimeType == null || !ALLOWED_MIME_TYPES.contains(mimeType.toLowerCase())) {
            throw new IllegalArgumentException("FILE_TYPE_NOT_ALLOWED");
        }
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
            response.setValidation(schemaValidator.validate(
                    llmResponse.getExtractedJson(),
                    docTypeDefinition.getJsonSchema(),
                    docTypeDefinition.getUiSchema()
            ));
        } catch (java.util.concurrent.TimeoutException e) {
            log.error("Ephemeral extraction timed out for docType {}:{}", docTypeDefinition.getDomainKey(), docTypeDefinition.getDocTypeKey());
            response.setStatus("FAILED");
            response.setError("Extraction timed out after " + EXTRACTION_TIMEOUT_SECONDS + " seconds");
            response.setFailure(new ExtractionFailure(
                    "EXTRACTION_TIMEOUT",
                    "The extraction timed out.",
                    true,
                    null
            ));
        } catch (java.util.concurrent.ExecutionException e) {
            log.error("Ephemeral extraction failed: {}", e.getCause() != null ? e.getCause().getMessage() : e.getMessage());
            response.setStatus("FAILED");
            response.setError("Extraction failed: " + (e.getCause() != null ? e.getCause().getMessage() : e.getMessage()));
            response.setFailure(new ExtractionFailure(
                    classifyFailure(e.getCause()),
                    "The AI provider could not extract this document.",
                    isRetryable(e.getCause()),
                    null
            ));
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            response.setStatus("FAILED");
            response.setError("Extraction was interrupted");
            response.setFailure(new ExtractionFailure(
                    "INTERRUPTED",
                    "The extraction was interrupted.",
                    true,
                    null
            ));
        }
        return response;
    }

    private String classifyFailure(Throwable cause) {
        String message = cause == null || cause.getMessage() == null
                ? ""
                : cause.getMessage().toLowerCase();
        if (message.contains("unsupported mime") || message.contains("mime type")) {
            return "LLM_REQUEST_INVALID";
        }
        if (message.contains("no candidates") || message.contains("no parts") || message.contains("parse")) {
            return "LLM_RESPONSE_INVALID";
        }
        if (message.contains("request must contain") || message.contains("mime")) {
            return "LLM_REQUEST_INVALID";
        }
        return "LLM_PROVIDER_ERROR";
    }

    private boolean isRetryable(Throwable cause) {
        String message = cause == null || cause.getMessage() == null
                ? ""
                : cause.getMessage().toLowerCase();
        return message.contains("timeout")
                || message.contains("429")
                || message.contains("503")
                || message.contains("504");
    }
}
