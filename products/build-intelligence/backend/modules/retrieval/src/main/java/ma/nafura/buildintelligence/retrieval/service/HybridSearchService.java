package ma.nafura.buildintelligence.retrieval.service;

import lombok.RequiredArgsConstructor;
import ma.nafura.buildintelligence.catalog.domain.WorkItem;
import ma.nafura.buildintelligence.catalog.service.CatalogService;
import ma.nafura.buildintelligence.retrieval.domain.DocumentChunk;
import ma.nafura.buildintelligence.retrieval.repository.DocumentChunkRepository;
import ma.nafura.platform.ai.llm.model.LlmCallContext;
import ma.nafura.platform.ai.llm.model.LlmMode;
import ma.nafura.platform.ai.llm.model.LlmRequest;
import ma.nafura.platform.ai.llm.model.ScopeType;
import ma.nafura.platform.ai.llm.service.LlmService;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class HybridSearchService {

    private final DocumentChunkRepository chunkRepository;
    private final CatalogService catalogService;
    private final LlmService llmService;

    @Transactional
    public void indexDocument(UUID documentId, List<String> chunks) {
        UUID tenantId = TenantContext.getTenantId();
        int index = 0;
        for (String chunk : chunks) {
            DocumentChunk entity = new DocumentChunk();
            entity.setTenantId(tenantId);
            entity.setDocumentId(documentId);
            entity.setChunkIndex(index++);
            entity.setContent(chunk);
            entity.setEmbeddingJson(embed(chunk, tenantId));
            entity.setMetadata(Map.of("source", "validated-document"));
            chunkRepository.save(entity);
        }
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> search(String query, int limit) {
        UUID tenantId = TenantContext.getTenantId();
        List<Map<String, Object>> results = new ArrayList<>();

        List<WorkItem> lexicalMatches = catalogService.searchWorkItems(query);
        for (WorkItem item : lexicalMatches) {
            Map<String, Object> hit = new HashMap<>();
            hit.put("type", "WORK_ITEM");
            hit.put("id", item.getId());
            hit.put("title", item.getDesignation());
            hit.put("score", 0.85);
            hit.put("source", Map.of("kind", "catalog"));
            results.add(hit);
        }

        List<DocumentChunk> chunks = chunkRepository.searchFullText(tenantId, query, limit);
        List<Double> queryEmbedding = embed(query, tenantId);
        for (DocumentChunk chunk : chunks) {
            double semantic = cosine(queryEmbedding, chunk.getEmbeddingJson());
            double lexical = 0.5;
            double score = 0.35 * semantic + 0.65 * lexical;
            Map<String, Object> hit = new HashMap<>();
            hit.put("type", "DOCUMENT_CHUNK");
            hit.put("id", chunk.getId());
            hit.put("documentId", chunk.getDocumentId());
            hit.put("excerpt", chunk.getContent());
            hit.put("score", score);
            hit.put("source", Map.of("chunkIndex", chunk.getChunkIndex()));
            results.add(hit);
        }

        return results.stream()
                .sorted(Comparator.comparingDouble(item -> -((Number) item.get("score")).doubleValue()))
                .limit(limit)
                .toList();
    }

    private List<Double> embed(String text, UUID tenantId) {
        try {
            LlmRequest request = new LlmRequest();
            request.setSystemInstruction("Return only a JSON array of 8 floats between -1 and 1 representing a semantic embedding.");
            request.setPrompt("Embed this BTP text: " + text);
            LlmCallContext context = LlmCallContext.builder()
                    .applicationId("build-intelligence")
                    .domainKey("retrieval")
                    .featureKey("embedding")
                    .actionKey("embed")
                    .mode(LlmMode.ASK)
                    .scopeType(ScopeType.TENANT)
                    .tenantId(tenantId.toString())
                    .build();
            String content = llmService.callLlm(request, context).get().getContent();
            if (content.startsWith("[")) {
                return new com.fasterxml.jackson.databind.ObjectMapper()
                        .readValue(content, new com.fasterxml.jackson.core.type.TypeReference<>() {});
            }
        } catch (Exception ignored) {
            // fallback deterministic pseudo-embedding
        }
        List<Double> fallback = new ArrayList<>();
        for (int i = 0; i < 8; i++) {
            fallback.add((double) ((text.hashCode() >> i) % 1000) / 1000.0);
        }
        return fallback;
    }

    private static double cosine(List<Double> left, List<Double> right) {
        if (left == null || right == null || left.isEmpty() || right.isEmpty()) {
            return 0.0;
        }
        int size = Math.min(left.size(), right.size());
        double dot = 0;
        double normLeft = 0;
        double normRight = 0;
        for (int i = 0; i < size; i++) {
            dot += left.get(i) * right.get(i);
            normLeft += left.get(i) * left.get(i);
            normRight += right.get(i) * right.get(i);
        }
        if (normLeft == 0 || normRight == 0) {
            return 0.0;
        }
        return dot / (Math.sqrt(normLeft) * Math.sqrt(normRight));
    }
}
