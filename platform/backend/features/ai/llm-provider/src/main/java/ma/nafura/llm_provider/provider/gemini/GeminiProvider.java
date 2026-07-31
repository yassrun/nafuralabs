package ma.nafura.platform.ai.llm.provider.gemini;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import ma.nafura.platform.ai.llm.model.ConversationTurn;
import ma.nafura.platform.ai.llm.model.LlmCallContext;
import ma.nafura.platform.ai.llm.model.LlmRequest;
import ma.nafura.platform.ai.llm.model.LlmResponse;
import ma.nafura.platform.ai.llm.model.LlmResponseFormat;
import ma.nafura.platform.ai.llm.model.NormalizedLlmRequest;
import ma.nafura.platform.ai.llm.model.ToolCall;
import ma.nafura.platform.ai.llm.model.ToolDefinition;
import ma.nafura.platform.ai.llm.model.TokenUsage;
import ma.nafura.platform.ai.llm.model.ToolResult;
import ma.nafura.platform.ai.llm.provider.AiProvider;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class GeminiProvider implements AiProvider {
    private final WebClient webClient;
    private final String apiKey;
    private final String baseUrl;
    private final String model;
    private final ObjectMapper objectMapper;

    public GeminiProvider(WebClient webClient, String apiKey, String baseUrl, String model) {
        this.webClient = webClient;
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
        this.model = model;
        this.objectMapper = new ObjectMapper();
    }

    @Override
    public String getProviderName() {
        return "gemini";
    }

    @Override
    public CompletableFuture<LlmResponse> call(NormalizedLlmRequest request, LlmCallContext context) {
        String requestId = UUID.randomUUID().toString();
        if (apiKey == null || apiKey.isEmpty()) {
            log.warn("Gemini API key is not configured. Falling back to mock LLM response.");
            return CompletableFuture.completedFuture(mapMockResponse(requestId, context, request));
        }

        return buildGeminiRequest(request)
            .flatMap(geminiRequest -> callGeminiApi(geminiRequest))
            .map(response -> mapToLlmResponse(response, requestId, context, request))
            .toFuture();
    }

    private Mono<Map<String, Object>> buildGeminiRequest(NormalizedLlmRequest request) {
        return Mono.fromCallable(() -> {
            Map<String, Object> geminiRequest = new HashMap<>();

            // 1. Build contents from conversation history OR single prompt
            List<Map<String, Object>> contents = new ArrayList<>();
            List<ConversationTurn> history = request.getConversationHistory();

            if (history != null && !history.isEmpty()) {
                for (ConversationTurn turn : history) {
                    switch (turn.getRole()) {
                        case USER -> {
                            List<Map<String, Object>> parts = new ArrayList<>();
                            if (turn.getContent() != null && !turn.getContent().isEmpty()) {
                                parts.add(Map.of("text", turn.getContent()));
                            }
                            if (!parts.isEmpty()) {
                                contents.add(Map.of("role", "user", "parts", parts));
                            }
                        }
                        case ASSISTANT -> {
                            if (turn.getToolCalls() != null && !turn.getToolCalls().isEmpty()) {
                                List<Map<String, Object>> parts = turn.getToolCalls().stream()
                                    .map(tc -> Map.<String, Object>of(
                                        "functionCall",
                                        Map.of("name", tc.getName(), "args", tc.getArguments() != null ? tc.getArguments() : objectMapper.createObjectNode())
                                    ))
                                    .toList();
                                contents.add(Map.of("role", "model", "parts", parts));
                            } else if (turn.getContent() != null) {
                                contents.add(Map.of("role", "model", "parts", List.of(Map.of("text", turn.getContent()))));
                            }
                        }
                        case TOOL -> {
                            if (turn.getToolResult() != null) {
                                ToolResult tr = turn.getToolResult();
                                Map<String, Object> functionResponse = new HashMap<>();
                                functionResponse.put("name", tr.getName());
                                functionResponse.put("response", Map.of("result", tr.getContent() != null ? tr.getContent() : ""));
                                contents.add(Map.of("role", "user", "parts", List.of(Map.of("functionResponse", functionResponse))));
                            }
                        }
                        case SYSTEM -> { /* system is sent via systemInstruction, skip in contents */ }
                    }
                }
            } else {
                // Fallback: single prompt (backward compatible)
                List<Map<String, Object>> parts = new ArrayList<>();
                if (request.getPrompt() != null && !request.getPrompt().isEmpty()) {
                    parts.add(Map.of("text", request.getPrompt()));
                }
                if (request.getMediaContents() != null) {
                    for (LlmRequest.MediaContent media : request.getMediaContents()) {
                        if (media.getUrl() != null && !media.getUrl().isEmpty()) {
                            parts.add(Map.of("fileData", Map.of("mimeType", media.getMimeType(), "fileUri", media.getUrl())));
                        } else if (media.getContentBase64() != null && !media.getContentBase64().isEmpty()) {
                            parts.add(Map.of("inlineData", Map.of("mimeType", media.getMimeType(), "data", media.getContentBase64())));
                        }
                    }
                }
                if (parts.isEmpty()) {
                    throw new IllegalArgumentException("Request must contain either a prompt or media content");
                }
                contents.add(Map.of("role", "user", "parts", parts));
            }

            geminiRequest.put("contents", contents);

            // 2. Add tools (function declarations)
            if (request.getTools() != null && !request.getTools().isEmpty()) {
                List<Map<String, Object>> functionDeclarations = request.getTools().stream()
                    .map(tool -> {
                        Map<String, Object> decl = new HashMap<>();
                        decl.put("name", tool.getName());
                        decl.put("description", tool.getDescription() != null ? tool.getDescription() : "");
                        if (tool.getParameters() != null) {
                            decl.put("parameters", sanitizeGeminiParameters(tool.getParameters()));
                        }
                        return decl;
                    })
                    .toList();
                geminiRequest.put("tools", List.of(Map.of("functionDeclarations", functionDeclarations)));
            }

            // 3. Tool choice config
            LlmRequest.ToolChoice toolChoice = request.getToolChoice() != null ? request.getToolChoice() : LlmRequest.ToolChoice.AUTO;
            if (toolChoice == LlmRequest.ToolChoice.NONE) {
                geminiRequest.put("toolConfig", Map.of("functionCallingConfig", Map.of("mode", "NONE")));
            } else if (toolChoice == LlmRequest.ToolChoice.REQUIRED) {
                geminiRequest.put("toolConfig", Map.of("functionCallingConfig", Map.of("mode", "ANY")));
            }

            // 4. System instruction
            if (request.getSystemInstruction() != null && !request.getSystemInstruction().isEmpty()) {
                geminiRequest.put("systemInstruction", Map.of("parts", List.of(Map.of("text", request.getSystemInstruction()))));
            }

            // 5. Generation config
            Map<String, Object> generationConfig = new HashMap<>();
            boolean hasTools = request.getTools() != null && !request.getTools().isEmpty();
            // Gemini: function calling + responseMimeType=application/json is unsupported.
            if (!hasTools && request.getResponseFormat() == LlmResponseFormat.JSON) {
                generationConfig.put("responseMimeType", "application/json");
                // Bordereaux can be hundreds of postes — default maxOutputTokens truncates.
                generationConfig.put("maxOutputTokens", 65536);
            }
            if (!hasTools && request.getResponseSchema() != null && !request.getResponseSchema().isEmpty()) {
                generationConfig.put(
                        "responseSchema",
                        sanitizeGeminiParameters(objectMapper.readTree(request.getResponseSchema()))
                );
                generationConfig.putIfAbsent("maxOutputTokens", 65536);
            }
            if (!generationConfig.isEmpty()) {
                geminiRequest.put("generationConfig", generationConfig);
            }

            return geminiRequest;
        });
    }

    private Mono<JsonNode> callGeminiApi(Map<String, Object> requestBody) {
        String url = String.format("%s/v1beta/models/%s:generateContent",
            baseUrl, model);

        return webClient.post()
            .uri(url)
            .header("x-goog-api-key", apiKey)
            .bodyValue(requestBody)
            .retrieve()
            .onStatus(status -> status.isError(), response -> {
                return response.bodyToMono(String.class)
                    .flatMap(errorBody -> {
                        String errorMessage = String.format("Gemini API error [%d]: %s", 
                            response.statusCode().value(), errorBody);
                        return Mono.error(new RuntimeException(errorMessage));
                    });
            })
            .bodyToMono(JsonNode.class)
            .onErrorMap(Exception.class, e -> {
                if (e instanceof RuntimeException) {
                    return e;
                }
                return new RuntimeException("Failed to call Gemini API: " + e.getMessage(), e);
            });
    }

    private LlmResponse mapToLlmResponse(
        JsonNode response,
        String requestId,
        LlmCallContext context,
        NormalizedLlmRequest request
    ) {
        try {
            JsonNode candidates = response.path("candidates");
            if (candidates.isEmpty() || !candidates.isArray()) {
                throw new RuntimeException("No candidates in Gemini response");
            }

            JsonNode candidate = candidates.get(0);
            JsonNode content = candidate.path("content");
            JsonNode parts = content.path("parts");

            if (parts.isEmpty() || !parts.isArray()) {
                throw new RuntimeException("No parts in candidate content");
            }

            String textContent = null;
            List<ToolCall> toolCalls = new ArrayList<>();
            for (JsonNode part : parts) {
                if (part.has("functionCall")) {
                    JsonNode fc = part.get("functionCall");
                    String name = fc.has("name") ? fc.path("name").asText() : "";
                    JsonNode args = fc.has("args") ? fc.get("args") : objectMapper.createObjectNode();
                    toolCalls.add(new ToolCall(UUID.randomUUID().toString(), name, args));
                } else if (part.has("text")) {
                    textContent = part.path("text").asText();
                }
            }

            LlmResponse.FinishReason finishReason = toolCalls.isEmpty()
                ? LlmResponse.FinishReason.STOP
                : LlmResponse.FinishReason.TOOL_CALL;
            if (textContent == null && toolCalls.isEmpty()) {
                textContent = "";
            }

            JsonNode usageMetadata = response.path("usageMetadata");
            Long inputTokens = usageMetadata.has("promptTokenCount")
                ? usageMetadata.path("promptTokenCount").asLong() : null;
            Long outputTokens = usageMetadata.has("candidatesTokenCount")
                ? usageMetadata.path("candidatesTokenCount").asLong() : null;
            Long totalTokens = usageMetadata.has("totalTokenCount")
                ? usageMetadata.path("totalTokenCount").asLong() : null;

            boolean estimated = (inputTokens == null || outputTokens == null);
            if (estimated) {
                inputTokens = 0L;
                outputTokens = 0L;
                totalTokens = 0L;
            }

            TokenUsage usage = new TokenUsage(inputTokens, outputTokens, totalTokens, estimated);

            return new LlmResponse(
                requestId,
                context != null ? context.getTenantId() : null,
                "gemini",
                model,
                textContent,
                usage,
                null,
                Instant.now(),
                request.getMode(),
                context != null ? context.getScopeType() : null,
                context != null ? context.getApplicationId() : null,
                context != null ? context.getDomainKey() : null,
                context != null ? context.getFeatureKey() : null,
                context != null ? context.getResourceKey() : null,
                context != null ? context.getActionKey() : null,
                context != null ? context.getConversationId() : null,
                context != null ? context.getMessageId() : null,
                context != null ? context.getActorSub() : null,
                toolCalls.isEmpty() ? null : toolCalls,
                finishReason
            );
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse Gemini response", e);
        }
    }

    /**
     * Gemini requires {@code items} on every array and {@code properties} on every object
     * in function-declaration parameter schemas.
     */
    /**
     * Gemini responseSchema / function parameters reject JSON Schema unions like
     * {@code "type": ["string","null"]}. Convert them to a single type + nullable.
     */
    JsonNode sanitizeGeminiParameters(JsonNode parameters) {
        if (parameters == null || parameters.isNull()) {
            return parameters;
        }
        JsonNode copy = parameters.deepCopy();
        if (!copy.isObject()) {
            return copy;
        }
        sanitizeSchemaNode((ObjectNode) copy);
        return copy;
    }

    private void sanitizeSchemaNode(ObjectNode node) {
        normalizeTypeUnion(node);
        node.remove("title");
        node.remove("$schema");
        node.remove("$defs");
        node.remove("$ref");
        node.remove("additionalProperties");

        String type = node.path("type").asText("");
        if ("array".equals(type) && !node.has("items")) {
            ObjectNode items = objectMapper.createObjectNode();
            items.put("type", "string");
            node.set("items", items);
        }
        if ("object".equals(type) && !node.has("properties")) {
            node.set("properties", objectMapper.createObjectNode());
        }
        JsonNode properties = node.get("properties");
        if (properties != null && properties.isObject()) {
            properties.fields().forEachRemaining(entry -> {
                if (entry.getValue() != null && entry.getValue().isObject()) {
                    sanitizeSchemaNode((ObjectNode) entry.getValue());
                }
            });
        }
        JsonNode items = node.get("items");
        if (items != null && items.isObject()) {
            sanitizeSchemaNode((ObjectNode) items);
        }
        JsonNode anyOf = node.get("anyOf");
        if (anyOf != null && anyOf.isArray()) {
            for (JsonNode option : anyOf) {
                if (option != null && option.isObject()) {
                    sanitizeSchemaNode((ObjectNode) option);
                }
            }
        }
    }

    private void normalizeTypeUnion(ObjectNode node) {
        JsonNode typeNode = node.get("type");
        if (typeNode == null || !typeNode.isArray()) {
            return;
        }
        String primary = null;
        boolean nullable = false;
        for (JsonNode entry : typeNode) {
            if (entry == null || !entry.isTextual()) {
                continue;
            }
            String value = entry.asText();
            if ("null".equals(value)) {
                nullable = true;
            } else if (primary == null) {
                primary = value;
            }
        }
        if (primary != null) {
            node.put("type", primary);
            if (nullable) {
                node.put("nullable", true);
            }
        } else {
            node.remove("type");
        }
    }

    private LlmResponse mapMockResponse(
        String requestId,
        LlmCallContext context,
        NormalizedLlmRequest request
    ) {
        String content = request.getMode() == null || request.getMode().name().equals("ASK")
            ? buildDevAskFallback()
            : "{\"summary\":\"Mode démo : configurez AI_GEMINI_API_KEY pour activer l'agent.\",\"actions\":[]}";

        TokenUsage usage = new TokenUsage(0L, 0L, 0L, true);
        return new LlmResponse(
            requestId,
            context != null ? context.getTenantId() : null,
            "gemini",
            model,
            content,
            usage,
            0.0,
            Instant.now(),
            request.getMode(),
            context != null ? context.getScopeType() : null,
            context != null ? context.getApplicationId() : null,
            context != null ? context.getDomainKey() : null,
            context != null ? context.getFeatureKey() : null,
            context != null ? context.getResourceKey() : null,
            context != null ? context.getActionKey() : null,
            context != null ? context.getConversationId() : null,
            context != null ? context.getMessageId() : null,
            context != null ? context.getActorSub() : null,
            null,
            LlmResponse.FinishReason.STOP
        );
    }

    private String buildDevAskFallback() {
        return """
            Bonjour ! L'assistant est en **mode démo** (clé Gemini non configurée).

            Configurez `AI_GEMINI_API_KEY` (ou `api_key` dans Vault sous `secret/nafura/.../integrations/ai/gemini`) puis redémarrez le backend pour activer les réponses IA complètes basées sur le schéma et les outils.
            """.trim();
    }
}

