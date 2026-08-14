package ma.nafura.platform.documents.docextractor.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import ma.nafura.platform.ai.llm.model.LlmCallContext;
import ma.nafura.platform.ai.llm.model.LlmMode;
import ma.nafura.platform.ai.llm.model.LlmRequest;
import ma.nafura.platform.ai.llm.model.LlmResponse;
import ma.nafura.platform.ai.llm.model.ScopeType;
import ma.nafura.platform.ai.llm.service.LlmService;
import ma.nafura.platform.documents.docextractor.api.response.ExtractionValidationDto;
import ma.nafura.platform.documents.docextractor.api.response.StatelessExtractionIssue;
import ma.nafura.platform.documents.docextractor.api.response.StatelessExtractionResponse;
import ma.nafura.platform.documents.docextractor.api.response.ValidationState;
import ma.nafura.platform.documents.docextractor.service.util.JsonDataCleaner;
import ma.nafura.platform.documents.docextractor.service.util.PdfTextExtractor;
import ma.nafura.platform.documents.docextractor.service.util.SpreadsheetTextExtractor;
import org.springframework.stereotype.Service;

import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * Stateless extraction use case. It knows neither DocTypeDefinition nor storage.
 */
@Service
@RequiredArgsConstructor
public class StatelessExtractionService {

    /** LLM call timeout. Overridable per product; large documents (full CPS) need more than the 120s default. */
    @org.springframework.beans.factory.annotation.Value("${nafura.doc-extractor.timeout-seconds:120}")
    private int timeoutSeconds;

    private static final String SCHEMA_PROPOSAL_RESPONSE_SCHEMA = """
            {
              "type": "object",
              "properties": {
                "dataSchemaJson": { "type": "string" },
                "presentationSchemaJson": { "type": "string" }
              },
              "required": ["dataSchemaJson", "presentationSchemaJson"]
            }
            """;

    private final LlmService llmService;
    private final SchemaValidator schemaValidator;
    private final ObjectMapper objectMapper;

    public StatelessExtractionResponse process(
            byte[] fileBytes,
            String fileName,
            String mimeType,
            String inlineSchema,
            String presentationSchema,
            String instructions,
            String tenantId
    ) {
        return process(fileBytes, fileName, mimeType, inlineSchema, presentationSchema, instructions, tenantId, null);
    }

    /**
     * @param maxPromptChars optional cap on PDF text prompt size (null = platform default).
     *                       Light passes should pass a lower value than full-document extraction.
     */
    public StatelessExtractionResponse process(
            byte[] fileBytes,
            String fileName,
            String mimeType,
            String inlineSchema,
            String presentationSchema,
            String instructions,
            String tenantId,
            Integer maxPromptChars
    ) {
        return process(
                fileBytes,
                fileName,
                mimeType,
                inlineSchema,
                presentationSchema,
                instructions,
                tenantId,
                maxPromptChars,
                false);
    }

    /**
     * @param maxPromptChars optional cap on PDF text prompt size (null = platform default).
     * @param forceMedia when true, skip text-layer extraction and send binary/image media
     *                   (needed for scanned PDFs that still expose a tiny OCR text layer).
     */
    public StatelessExtractionResponse process(
            byte[] fileBytes,
            String fileName,
            String mimeType,
            String inlineSchema,
            String presentationSchema,
            String instructions,
            String tenantId,
            Integer maxPromptChars,
            boolean forceMedia
    ) {
        if (inlineSchema == null || inlineSchema.isBlank()) {
            return failure(
                    "REQUEST",
                    "SCHEMA_REQUIRED",
                    "inlineSchema is required for extraction. Use /propose-schema first for unknown documents.",
                    false
            );
        }
        try {
            return extract(
                    fileBytes,
                    fileName,
                    mimeType,
                    inlineSchema,
                    presentationSchema,
                    instructions,
                    tenantId,
                    maxPromptChars,
                    forceMedia);
        } catch (java.util.concurrent.TimeoutException e) {
            return failure("LLM", "EXTRACTION_TIMEOUT", "Extraction timed out.", true);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return failure("SYSTEM", "INTERRUPTED", "Extraction was interrupted.", true);
        } catch (Exception e) {
            Throwable cause = e instanceof java.util.concurrent.ExecutionException && e.getCause() != null
                    ? e.getCause()
                    : e;
            if (isTimeout(cause)) {
                return failure("LLM", "EXTRACTION_TIMEOUT", safeMessage(cause), true);
            }
            return failure("LLM", "LLM_PROVIDER_ERROR", safeMessage(cause), isRetryable(cause));
        }
    }

    public StatelessExtractionResponse proposeSchemas(
            byte[] fileBytes,
            String fileName,
            String mimeType,
            String instructions,
            String tenantId
    ) {
        try {
            LlmRequest request = baseRequest(fileBytes, fileName, mimeType);
            request.setSystemInstruction("""
                    Analyze the supplied document and propose two JSON documents.
                    dataSchemaJson must be a JSON Schema object using only object, array, string, number,
                    integer, boolean, required, properties, items, enum and string format=date.
                    presentationSchemaJson must be a small presentation hint object with rootView
                    (auto, form, table or treeTable), labelField, columns, hiddenFields and readOnlyFields.
                    Never emit UI code. Return each JSON document serialized as a JSON string.
                    """ + optionalInstructions(instructions));
            request.setResponseSchema(SCHEMA_PROPOSAL_RESPONSE_SCHEMA);

            LlmResponse llm = call(request, tenantId, "propose-schema");
            JsonNode envelope = objectMapper.readTree(llm.getContent());
            JsonNode dataSchema = parseEmbeddedJson(envelope, "dataSchemaJson");
            JsonNode proposedPresentation = parseEmbeddedJson(envelope, "presentationSchemaJson");

            if (!dataSchema.isObject() || !"object".equals(dataSchema.path("type").asText())) {
                return failure("SCHEMA", "INVALID_SCHEMA_PROPOSAL",
                        "The proposed data schema is not an object schema.", false);
            }

            return new StatelessExtractionResponse(
                    StatelessExtractionResponse.Outcome.SCHEMA_PROPOSAL_PENDING,
                    null,
                    dataSchema,
                    proposedPresentation,
                    null,
                    List.of(),
                    llm.getRequestId(),
                    llm.getProvider(),
                    llm.getModel(),
                    llm.getCostUsd(),
                    llm.getCreatedAt()
            );
        } catch (java.util.concurrent.TimeoutException e) {
            return failure("LLM", "SCHEMA_PROPOSAL_TIMEOUT", "Schema proposal timed out.", true);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return failure("SYSTEM", "INTERRUPTED", "Schema proposal was interrupted.", true);
        } catch (Exception e) {
            Throwable cause = e instanceof java.util.concurrent.ExecutionException && e.getCause() != null
                    ? e.getCause()
                    : e;
            return failure("LLM", "INVALID_SCHEMA_PROPOSAL", safeMessage(cause), isRetryable(cause));
        }
    }

    private StatelessExtractionResponse extract(
            byte[] fileBytes,
            String fileName,
            String mimeType,
            String inlineSchema,
            String presentationSchema,
            String instructions,
            String tenantId,
            Integer maxPromptChars,
            boolean forceMedia
    ) throws Exception {
        JsonNode schema = objectMapper.readTree(inlineSchema);
        if (!schema.isObject() || !"object".equals(schema.path("type").asText())) {
            return failure("REQUEST", "INVALID_INLINE_SCHEMA",
                    "inlineSchema must be a JSON object schema.", false);
        }

        JsonNode presentation = null;
        if (presentationSchema != null && !presentationSchema.isBlank()) {
            presentation = objectMapper.readTree(presentationSchema);
            if (!presentation.isObject()) {
                return failure("REQUEST", "INVALID_PRESENTATION_SCHEMA",
                        "presentationSchema must be a JSON object.", false);
            }
        }

        LlmRequest request = baseRequest(fileBytes, fileName, mimeType, maxPromptChars, forceMedia);
        request.setSystemInstruction("""
                Extract only information observable in the supplied document.
                Return JSON matching the response schema exactly. Never invent values.
                When a value is absent, use null if allowed by the schema; otherwise use an empty
                value of the expected type so local validation can flag it for human review.
                """ + optionalInstructions(instructions));
        request.setResponseSchema(inlineSchema);

        LlmResponse llm = call(request, tenantId, "extract");
        JsonNode data = objectMapper.readTree(JsonDataCleaner.cleanJsonString(llm.getContent()));
        ExtractionValidationDto validation = schemaValidator.validate(
                objectMapper.writeValueAsString(data),
                inlineSchema,
                presentationSchema
        );

        List<StatelessExtractionIssue> issues = validation.issues().stream()
                .map(issue -> new StatelessExtractionIssue(
                        "DATA",
                        issue.kind().name(),
                        issue.path(),
                        issue.rowIndex(),
                        issue.message(),
                        false
                ))
                .toList();

        StatelessExtractionResponse.Outcome outcome = validation.state() == ValidationState.VALID
                ? StatelessExtractionResponse.Outcome.COMPLETED
                : StatelessExtractionResponse.Outcome.REVIEW_REQUIRED;

        return new StatelessExtractionResponse(
                outcome,
                data,
                schema,
                presentation,
                validation,
                issues,
                llm.getRequestId(),
                llm.getProvider(),
                llm.getModel(),
                llm.getCostUsd(),
                llm.getCreatedAt()
        );
    }

    private LlmRequest baseRequest(byte[] fileBytes, String fileName, String mimeType) {
        return baseRequest(fileBytes, fileName, mimeType, null, false);
    }

    private LlmRequest baseRequest(
            byte[] fileBytes, String fileName, String mimeType, Integer maxPromptChars) {
        return baseRequest(fileBytes, fileName, mimeType, maxPromptChars, false);
    }

    private LlmRequest baseRequest(
            byte[] fileBytes,
            String fileName,
            String mimeType,
            Integer maxPromptChars,
            boolean forceMedia) {
        LlmRequest request = new LlmRequest();
        request.setMetadata(Map.of("fileName", fileName == null ? "document" : fileName));

        if (SpreadsheetTextExtractor.isTabularMime(mimeType)) {
            request.setPrompt(SpreadsheetTextExtractor.toPromptText(fileBytes, mimeType, fileName));
            request.setMediaContents(List.of());
            return request;
        }

        // Plain text payloads (e.g. CPS sections already retrieved) — never wrap as binary.
        if (mimeType != null && mimeType.toLowerCase(java.util.Locale.ROOT).startsWith("text/")) {
            request.setPrompt(new String(fileBytes, java.nio.charset.StandardCharsets.UTF_8));
            request.setMediaContents(List.of());
            return request;
        }

        // Text-layer PDFs (typical BDP): send text — faster and avoids TLS EOF on inline PDF.
        // Even with forceMedia, ALWAYS attach extractable text when present: DeepSeek (and other
        // text-only OpenAI-compat providers) ignore mediaContents, so forceMedia-only requests
        // hang on empty prompts. Multimodal providers still receive the binary below.
        if (PdfTextExtractor.isPdfMime(mimeType, fileName)) {
            String pdfText = maxPromptChars != null && maxPromptChars > 0
                    ? PdfTextExtractor.tryPromptText(fileBytes, fileName, maxPromptChars)
                    : PdfTextExtractor.tryPromptText(fileBytes, fileName);
            if (pdfText != null && !pdfText.isBlank()) {
                request.setPrompt(pdfText);
                if (!forceMedia) {
                    request.setMediaContents(List.of());
                    return request;
                }
            } else if (!forceMedia) {
                // No text layer — fall through to binary media.
            } else {
                // forceMedia + no text: binary only (multimodal providers).
            }
        }

        if (fileBytes != null && fileBytes.length > 0) {
            LlmRequest.MediaContent media = new LlmRequest.MediaContent();
            media.setContentBase64(Base64.getEncoder().encodeToString(fileBytes));
            media.setMimeType(mimeType);
            media.setType(mimeType != null && mimeType.startsWith("image/")
                    ? LlmRequest.MediaType.IMAGE
                    : LlmRequest.MediaType.DOCUMENT);
            request.setMediaContents(List.of(media));
        }
        return request;
    }

    private LlmResponse call(LlmRequest request, String tenantId, String action) throws Exception {
        LlmCallContext context = LlmCallContext.builder()
                .applicationId("doc-extractor")
                .domainKey("documents")
                .featureKey("stateless-extraction")
                .resourceKey("inline-schema")
                .actionKey(action)
                .mode(LlmMode.ASK)
                .scopeType(tenantId == null || tenantId.isBlank() ? ScopeType.GLOBAL : ScopeType.TENANT)
                .tenantId(tenantId)
                .build();
        return llmService.callLlm(request, context).get(timeoutSeconds, TimeUnit.SECONDS);
    }

    private JsonNode parseEmbeddedJson(JsonNode envelope, String field) throws Exception {
        JsonNode node = envelope.get(field);
        if (node == null || !node.isTextual()) {
            throw new IllegalArgumentException("Missing " + field + " in schema proposal");
        }
        return objectMapper.readTree(node.asText());
    }

    private StatelessExtractionResponse failure(
            String source,
            String code,
            String message,
            boolean retryable
    ) {
        StatelessExtractionResponse.Outcome outcome = "REQUEST".equals(source) || "SCHEMA".equals(source)
                ? StatelessExtractionResponse.Outcome.REJECTED
                : StatelessExtractionResponse.Outcome.TECHNICAL_FAILURE;
        return new StatelessExtractionResponse(
                outcome,
                null,
                null,
                null,
                null,
                List.of(new StatelessExtractionIssue(source, code, null, null, message, retryable)),
                null,
                null,
                null,
                null,
                null
        );
    }

    private String optionalInstructions(String instructions) {
        return instructions == null || instructions.isBlank()
                ? ""
                : "\nAdditional extraction guidance:\n" + instructions.trim();
    }

    private String safeMessage(Throwable error) {
        return error == null || error.getMessage() == null || error.getMessage().isBlank()
                ? "The AI provider could not process this document."
                : error.getMessage();
    }

    private boolean isTimeout(Throwable error) {
        Throwable current = error;
        while (current != null) {
            if (current instanceof java.util.concurrent.TimeoutException) {
                return true;
            }
            String message = current.getMessage();
            if (message != null) {
                String lower = message.toLowerCase();
                if (lower.contains("timed out")
                        || lower.contains("eof")
                        || lower.contains("premature")
                        || lower.contains("connection closed")
                        || lower.contains("broken pipe")) {
                    return true;
                }
            }
            current = current.getCause();
        }
        return false;
    }

    private boolean isRetryable(Throwable error) {
        if (isTimeout(error)) {
            return true;
        }
        String message = safeMessage(error).toLowerCase();
        return message.contains("timeout")
                || message.contains("429")
                || message.contains("503")
                || message.contains("504")
                || message.contains("connection reset")
                || message.contains("eof")
                || message.contains("premature");
    }
}
