package ma.nafura.platform.documents.docextractor.service;

import ma.nafura.platform.documents.docextractor.domain.model.DocTypeDefinition;
import ma.nafura.platform.documents.docextractor.domain.model.ExtractionRequest;
import ma.nafura.platform.documents.docextractor.domain.model.ExtractionResponse;
import ma.nafura.platform.documents.docextractor.service.util.JsonDataCleaner;
import ma.nafura.platform.ai.llm.model.LlmCallContext;
import ma.nafura.platform.ai.llm.model.LlmMode;
import ma.nafura.platform.ai.llm.model.LlmRequest;
import ma.nafura.platform.ai.llm.model.LlmResponse;
import ma.nafura.platform.ai.llm.model.ScopeType;
import ma.nafura.platform.ai.llm.service.LlmService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;

@Service
public class ExtractionService {
    private static final Logger log = LoggerFactory.getLogger(ExtractionService.class);
    
    private final LlmService llmService;

    public ExtractionService(LlmService llmService) {
        this.llmService = llmService;
    }


    /**
     * Extract using DocTypeDefinition (new approach).
     * Uses jsonSchema and promptTemplate from DocTypeDefinition.
     */
    public CompletableFuture<ExtractionResponse> extractWithDocTypeDefinition(
            ExtractionRequest request,
            DocTypeDefinition docTypeDefinition,
            String tenantId,
            String idempotencyKey) {
        
        // Build LLM request using DocTypeDefinition
        LlmRequest llmRequest = buildLlmRequestFromDocTypeDefinition(request, docTypeDefinition);
        LlmCallContext callContext = LlmCallContext.builder()
            .applicationId("doc-extractor")
            .domainKey(docTypeDefinition.getDomainKey())
            .featureKey("extraction")
            .resourceKey(docTypeDefinition.getDocTypeKey())
            .actionKey("extract")
            .mode(LlmMode.ASK)
            .scopeType(tenantId != null && !tenantId.isBlank() ? ScopeType.TENANT : ScopeType.GLOBAL)
            .tenantId(tenantId)
            .actorSub(request.getMetadata() != null ? (String) request.getMetadata().get("actorSub") : null)
            .conversationId(request.getMetadata() != null ? (String) request.getMetadata().get("conversationId") : null)
            .messageId(request.getMetadata() != null ? (String) request.getMetadata().get("messageId") : null)
            .idempotencyKey(idempotencyKey)
            .build();
        
        // Call LLM service
        return llmService.callLlm(llmRequest, callContext)
            .thenApply(llmResponse -> {
                return mapToExtractionResponse(llmResponse, request);
            });
    }

    private LlmRequest.MediaType determineMediaType(String mimeType) {
        if (mimeType == null) {
            return LlmRequest.MediaType.DOCUMENT;
        }
        
        if (mimeType.startsWith("image/")) {
            return LlmRequest.MediaType.IMAGE;
        } else if (mimeType.startsWith("audio/")) {
            return LlmRequest.MediaType.AUDIO;
        } else if (mimeType.startsWith("video/")) {
            return LlmRequest.MediaType.VIDEO;
        } else {
            return LlmRequest.MediaType.DOCUMENT;
        }
    }

    private LlmRequest buildLlmRequestFromDocTypeDefinition(ExtractionRequest request, DocTypeDefinition docTypeDefinition) {
        LlmRequest llmRequest = new LlmRequest();
        
        // Use promptTemplate from DocTypeDefinition
        llmRequest.setSystemInstruction(docTypeDefinition.getPromptTemplate());
        
        // Use jsonSchema from DocTypeDefinition
        llmRequest.setResponseSchema(docTypeDefinition.getJsonSchema());
        
        // Build media contents
        List<LlmRequest.MediaContent> mediaContents = new ArrayList<>();
        
        if (request.getUrl() != null && !request.getUrl().isEmpty()) {
            // Use URL if provided
            LlmRequest.MediaContent media = new LlmRequest.MediaContent();
            media.setUrl(request.getUrl());
            media.setMimeType(request.getMimeType());
            media.setType(determineMediaType(request.getMimeType()));
            mediaContents.add(media);
        } else if (request.getContentBase64() != null && !request.getContentBase64().isEmpty()) {
            // Use base64 content
            LlmRequest.MediaContent media = new LlmRequest.MediaContent();
            media.setContentBase64(request.getContentBase64());
            media.setMimeType(request.getMimeType());
            media.setType(determineMediaType(request.getMimeType()));
            mediaContents.add(media);
        }
        
        llmRequest.setMediaContents(mediaContents);
        
        // Set metadata
        llmRequest.setMetadata(request.getMetadata());
        
        return llmRequest;
    }

    private ExtractionResponse mapToExtractionResponse(LlmResponse llmResponse, ExtractionRequest request) {
        ExtractionResponse response = new ExtractionResponse();
        response.setRequestId(llmResponse.getRequestId());
        response.setTenantId(llmResponse.getTenantId());
        response.setProvider(llmResponse.getProvider());
        response.setModel(llmResponse.getModel());
        
        // Clean extracted JSON: convert string "null" to actual null
        String cleanedJson = JsonDataCleaner.cleanJsonString(llmResponse.getContent());
        response.setExtractedJson(cleanedJson);
        
        response.setCostUsd(llmResponse.getCostUsd());
        response.setCreatedAt(llmResponse.getCreatedAt());
        return response;
    }
}


