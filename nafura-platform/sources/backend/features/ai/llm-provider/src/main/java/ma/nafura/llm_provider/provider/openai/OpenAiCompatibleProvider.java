package ma.nafura.platform.ai.llm.provider.openai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import ma.nafura.platform.ai.llm.model.ConversationTurn;
import ma.nafura.platform.ai.llm.model.LlmCallContext;
import ma.nafura.platform.ai.llm.model.LlmRequest;
import ma.nafura.platform.ai.llm.model.LlmResponse;
import ma.nafura.platform.ai.llm.model.LlmResponseFormat;
import ma.nafura.platform.ai.llm.model.NormalizedLlmRequest;
import ma.nafura.platform.ai.llm.model.TokenUsage;
import ma.nafura.platform.ai.llm.model.ToolCall;
import ma.nafura.platform.ai.llm.model.ToolDefinition;
import ma.nafura.platform.ai.llm.model.ToolResult;
import ma.nafura.platform.ai.llm.provider.AiProvider;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import lombok.extern.slf4j.Slf4j;

/** OpenAI Chat Completions compatible provider (DeepSeek, etc.). */
@Slf4j
public class OpenAiCompatibleProvider implements AiProvider {

    private final String providerName;
    private final WebClient webClient;
    private final String apiKey;
    private final String defaultModel;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public OpenAiCompatibleProvider(
        String providerName,
        WebClient webClient,
        String apiKey,
        String defaultModel
    ) {
        this.providerName = providerName;
        this.webClient = webClient;
        this.apiKey = apiKey;
        this.defaultModel = defaultModel;
    }

    @Override
    public String getProviderName() {
        return providerName;
    }

    @Override
    public CompletableFuture<LlmResponse> call(NormalizedLlmRequest request, LlmCallContext context) {
        String requestId = UUID.randomUUID().toString();
        String model = effectiveModel(context);
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("{} API key is not configured. Falling back to mock LLM response.", providerName);
            return CompletableFuture.completedFuture(mapMockResponse(requestId, context, request, model));
        }

        return Mono.fromCallable(() -> buildRequest(request, model))
            .flatMap(this::callApi)
            .map(response -> mapToLlmResponse(response, requestId, context, request, model))
            .toFuture();
    }

    private String effectiveModel(LlmCallContext context) {
        if (context != null && context.getModelOverride() != null && !context.getModelOverride().isBlank()) {
            return context.getModelOverride().trim();
        }
        return defaultModel;
    }

    public String getDefaultModel() {
        return defaultModel;
    }

    public boolean hasApiKey() {
        return apiKey != null && !apiKey.isBlank();
    }

    private Map<String, Object> buildRequest(NormalizedLlmRequest request, String model) {
        Map<String, Object> body = new HashMap<>();
        body.put("model", model);

        List<Map<String, Object>> messages = new ArrayList<>();
        if (request.getSystemInstruction() != null && !request.getSystemInstruction().isBlank()) {
            messages.add(Map.of("role", "system", "content", request.getSystemInstruction()));
        }

        List<ConversationTurn> history = request.getConversationHistory();
        if (history != null && !history.isEmpty()) {
            for (ConversationTurn turn : history) {
                switch (turn.getRole()) {
                    case USER -> {
                        if (turn.getContent() != null && !turn.getContent().isBlank()) {
                            messages.add(Map.of("role", "user", "content", turn.getContent()));
                        }
                    }
                    case ASSISTANT -> {
                        Map<String, Object> msg = new HashMap<>();
                        msg.put("role", "assistant");
                        msg.put("content", turn.getContent() != null ? turn.getContent() : "");
                        if (turn.getToolCalls() != null && !turn.getToolCalls().isEmpty()) {
                            List<Map<String, Object>> toolCalls = new ArrayList<>();
                            for (ToolCall tc : turn.getToolCalls()) {
                                Map<String, Object> fn = new HashMap<>();
                                fn.put("name", tc.getName());
                                String args = tc.getArguments() != null ? tc.getArguments().toString() : "{}";
                                fn.put("arguments", args);
                                toolCalls.add(Map.of(
                                    "id", tc.getId() != null ? tc.getId() : UUID.randomUUID().toString(),
                                    "type", "function",
                                    "function", fn
                                ));
                            }
                            msg.put("tool_calls", toolCalls);
                        }
                        messages.add(msg);
                    }
                    case TOOL -> {
                        ToolResult tr = turn.getToolResult();
                        if (tr != null) {
                            Map<String, Object> msg = new HashMap<>();
                            msg.put("role", "tool");
                            msg.put("tool_call_id", tr.getToolCallId() != null ? tr.getToolCallId() : "unknown");
                            msg.put("content", tr.getContent() != null ? tr.getContent() : "");
                            messages.add(msg);
                        }
                    }
                    case SYSTEM -> { /* systemInstruction preferred */ }
                }
            }
        } else if (request.getPrompt() != null && !request.getPrompt().isBlank()) {
            messages.add(Map.of("role", "user", "content", request.getPrompt()));
        }

        body.put("messages", messages);

        List<ToolDefinition> tools = request.getTools();
        if (tools != null && !tools.isEmpty()) {
            List<Map<String, Object>> toolDefs = new ArrayList<>();
            for (ToolDefinition t : tools) {
                Map<String, Object> fn = new HashMap<>();
                fn.put("name", t.getName());
                if (t.getDescription() != null) {
                    fn.put("description", t.getDescription());
                }
                if (t.getParameters() != null && !t.getParameters().isNull()) {
                    fn.put("parameters", objectMapper.convertValue(t.getParameters(), Map.class));
                } else {
                    fn.put("parameters", Map.of("type", "object", "properties", Map.of()));
                }
                toolDefs.add(Map.of("type", "function", "function", fn));
            }
            body.put("tools", toolDefs);

            LlmRequest.ToolChoice choice = request.getToolChoice();
            if (choice == LlmRequest.ToolChoice.NONE) {
                body.put("tool_choice", "none");
            } else if (choice == LlmRequest.ToolChoice.REQUIRED) {
                body.put("tool_choice", "required");
            } else {
                body.put("tool_choice", "auto");
            }
        }

        if ((tools == null || tools.isEmpty()) && request.getResponseFormat() == LlmResponseFormat.JSON) {
            body.put("response_format", Map.of("type", "json_object"));
        }

        // V4 flash/pro think by default ; reasoning eats max_tokens and returns empty content.
        if ("deepseek".equals(providerName)) {
            body.put("thinking", Map.of("type", "disabled"));
            body.put("max_tokens", 65_536);
        }

        return body;
    }

    private Mono<JsonNode> callApi(Map<String, Object> body) {
        return webClient.post()
            .uri("/chat/completions")
            .header("Authorization", "Bearer " + apiKey)
            .header("Content-Type", "application/json")
            .bodyValue(body)
            .retrieve()
            .onStatus(status -> status.isError(), response ->
                response.bodyToMono(String.class).flatMap(errorBody ->
                    Mono.error(new RuntimeException(String.format(
                        "%s API error [%d]: %s",
                        providerName,
                        response.statusCode().value(),
                        errorBody
                    )))
                )
            )
            .bodyToMono(JsonNode.class)
            .onErrorMap(Exception.class, e -> {
                if (e instanceof RuntimeException re) {
                    return re;
                }
                return new RuntimeException("Failed to call " + providerName + " API: " + e.getMessage(), e);
            });
    }

    private LlmResponse mapToLlmResponse(
        JsonNode response,
        String requestId,
        LlmCallContext context,
        NormalizedLlmRequest request,
        String model
    ) {
        try {
            JsonNode message = response.path("choices").path(0).path("message");
            String textContent = message.path("content").isNull() ? null : message.path("content").asText(null);

            List<ToolCall> toolCalls = new ArrayList<>();
            JsonNode toolCallsNode = message.path("tool_calls");
            if (toolCallsNode.isArray()) {
                for (JsonNode tc : toolCallsNode) {
                    String id = tc.path("id").asText(UUID.randomUUID().toString());
                    String name = tc.path("function").path("name").asText("");
                    String argsRaw = tc.path("function").path("arguments").asText("{}");
                    JsonNode argsNode;
                    try {
                        argsNode = objectMapper.readTree(argsRaw);
                    } catch (Exception ex) {
                        argsNode = objectMapper.getNodeFactory().textNode(argsRaw);
                    }
                    toolCalls.add(new ToolCall(id, name, argsNode));
                }
            }

            LlmResponse.FinishReason finishReason = toolCalls.isEmpty()
                ? LlmResponse.FinishReason.STOP
                : LlmResponse.FinishReason.TOOL_CALL;
            if (textContent == null && toolCalls.isEmpty()) {
                textContent = "";
            }

            JsonNode usageNode = response.path("usage");
            Long inputTokens = usageNode.has("prompt_tokens") ? usageNode.path("prompt_tokens").asLong() : null;
            Long outputTokens = usageNode.has("completion_tokens") ? usageNode.path("completion_tokens").asLong() : null;
            Long totalTokens = usageNode.has("total_tokens") ? usageNode.path("total_tokens").asLong() : null;
            boolean estimated = (inputTokens == null || outputTokens == null);
            if (estimated) {
                inputTokens = 0L;
                outputTokens = 0L;
                totalTokens = 0L;
            }

            return new LlmResponse(
                requestId,
                context != null ? context.getTenantId() : null,
                providerName,
                model,
                textContent,
                new TokenUsage(inputTokens, outputTokens, totalTokens, estimated),
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
            throw new RuntimeException("Failed to parse " + providerName + " response", e);
        }
    }

    private LlmResponse mapMockResponse(
        String requestId,
        LlmCallContext context,
        NormalizedLlmRequest request,
        String model
    ) {
        return new LlmResponse(
            requestId,
            context != null ? context.getTenantId() : null,
            providerName,
            model,
            "Mode démo : configurez la clé API " + providerName + " pour activer le LLM.",
            new TokenUsage(0L, 0L, 0L, true),
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
}
