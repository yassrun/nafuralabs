package ma.nafura.platform.ai.llm.service;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import ma.nafura.platform.ai.llm.config.LlmExecutionProperties;
import ma.nafura.platform.ai.llm.cost.CostCalculator;
import ma.nafura.platform.ai.llm.domain.model.AiUsageEvent;
import ma.nafura.platform.ai.llm.model.ConversationTurn;
import ma.nafura.platform.ai.llm.model.LlmCallContext;
import ma.nafura.platform.ai.llm.model.LlmMode;
import ma.nafura.platform.ai.llm.model.LlmRequest;
import ma.nafura.platform.ai.llm.model.LlmResponse;
import ma.nafura.platform.ai.llm.model.NormalizedLlmRequest;
import ma.nafura.platform.ai.llm.model.ScopeType;
import ma.nafura.platform.ai.llm.model.TokenUsage;
import ma.nafura.platform.ai.llm.model.ToolResult;
import ma.nafura.platform.ai.llm.provider.AiProvider;
import ma.nafura.platform.ai.llm.repository.AiUsageEventRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.List;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;
import java.util.concurrent.Executor;
import java.util.concurrent.TimeUnit;
import java.util.function.Function;

@Service
public class LlmService {
    private static final Logger log = LoggerFactory.getLogger(LlmService.class);
    private static final String UNKNOWN = "unknown";

    private final AiProvider aiProvider;
    private final CostCalculator costCalculator;
    private final AiUsageEventRepository usageEventRepository;
    private final LlmRequestNormalizer requestNormalizer;
    private final LlmExecutionProperties executionProperties;
    private final Executor llmAuditExecutor;
    private final Optional<MeterRegistry> meterRegistry;

    public LlmService(
        AiProvider aiProvider,
        CostCalculator costCalculator,
        AiUsageEventRepository usageEventRepository,
        LlmRequestNormalizer requestNormalizer,
        LlmExecutionProperties executionProperties,
        @Qualifier("llmAuditExecutor") Executor llmAuditExecutor,
        @Autowired(required = false) MeterRegistry meterRegistry
    ) {
        this.aiProvider = aiProvider;
        this.costCalculator = costCalculator;
        this.usageEventRepository = usageEventRepository;
        this.requestNormalizer = requestNormalizer;
        this.executionProperties = executionProperties;
        this.llmAuditExecutor = llmAuditExecutor;
        this.meterRegistry = Optional.ofNullable(meterRegistry);
    }

    /**
     * Backward-compatible API.
     */
    public CompletableFuture<LlmResponse> callLlm(LlmRequest request, String tenantId, String idempotencyKey) {
        LlmCallContext context = LlmCallContext.builder()
            .tenantId(trimToNull(tenantId))
            .scopeType(trimToNull(tenantId) != null ? ScopeType.TENANT : ScopeType.GLOBAL)
            .mode(LlmMode.ASK)
            .idempotencyKey(trimToNull(idempotencyKey))
            .build();
        return callLlm(request, context);
    }

    public CompletableFuture<LlmResponse> callLlm(LlmRequest request, LlmCallContext context) {
        LlmCallContext normalizedContext = normalizeContext(context);
        NormalizedLlmRequest normalizedRequest = requestNormalizer.normalize(request, normalizedContext);
        String scopeKey = buildScopeKey(normalizedContext);
        String idempotencyKey = trimToNull(normalizedContext.getIdempotencyKey());

        Optional<AiUsageEvent> cached = findIdempotentEvent(scopeKey, idempotencyKey);
        if (cached.isPresent()) {
            return replayIdempotentEvent(cached.get());
        }

        String requestId = UUID.randomUUID().toString();
        long startedAtNanos = System.nanoTime();
        Timer.Sample sample = meterRegistry.map(Timer::start).orElse(null);

        return executeWithRetry(normalizedRequest, normalizedContext, 0)
            .handleAsync((response, throwable) -> {
                long latencyMs = TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - startedAtNanos);
                if (throwable == null) {
                    return CompletableFuture.completedFuture(
                        onSuccess(response, normalizedContext, scopeKey, requestId, latencyMs, sample)
                    );
                }
                return onFailure(throwable, normalizedContext, scopeKey, requestId, latencyMs, sample);
            }, llmAuditExecutor)
            .thenCompose(Function.identity());
    }

    /**
     * Calls the LLM with tool support: runs a loop of call → execute tools → call
     * until the model returns a final text response or maxToolRounds is reached.
     */
    public CompletableFuture<LlmResponse> callLlmWithTools(
        LlmRequest request,
        LlmCallContext context,
        ToolExecutor toolExecutor,
        int maxToolRounds
    ) {
        LlmCallContext normalizedContext = normalizeContext(context);
        List<ConversationTurn> conversationHistory = request.getConversationHistory() != null
            ? new ArrayList<>(request.getConversationHistory())
            : new ArrayList<>();

        LlmRequest currentRequest = new LlmRequest();
        currentRequest.setPrompt(request.getPrompt());
        currentRequest.setMediaContents(request.getMediaContents());
        currentRequest.setSystemInstruction(request.getSystemInstruction());
        currentRequest.setResponseSchema(request.getResponseSchema());
        currentRequest.setMetadata(request.getMetadata());
        currentRequest.setMode(request.getMode());
        currentRequest.setTools(request.getTools());
        currentRequest.setToolChoice(request.getToolChoice());
        currentRequest.setConversationHistory(conversationHistory.isEmpty() ? null : conversationHistory);

        CompletableFuture<LlmResponse> future = callLlm(currentRequest, normalizedContext);
        for (int round = 0; round < maxToolRounds; round++) {
            future = future.thenCompose(response -> {
                if (response == null || !response.requiresToolExecution()) {
                    return CompletableFuture.completedFuture(response);
                }
                List<ToolResult> results = toolExecutor.executeTools(response.getToolCalls());
                conversationHistory.add(ConversationTurn.assistantToolCalls(response.getToolCalls()));
                for (ToolResult tr : results) {
                    conversationHistory.add(ConversationTurn.tool(tr));
                }
                LlmRequest nextRequest = new LlmRequest();
                nextRequest.setSystemInstruction(currentRequest.getSystemInstruction());
                nextRequest.setTools(currentRequest.getTools());
                nextRequest.setToolChoice(currentRequest.getToolChoice());
                nextRequest.setConversationHistory(new ArrayList<>(conversationHistory));
                nextRequest.setMode(currentRequest.getMode());
                nextRequest.setMetadata(currentRequest.getMetadata());
                LlmCallContext nextContext = LlmCallContext.builder()
                    .applicationId(normalizedContext.getApplicationId())
                    .domainKey(normalizedContext.getDomainKey())
                    .featureKey(normalizedContext.getFeatureKey())
                    .resourceKey(normalizedContext.getResourceKey())
                    .actionKey(normalizedContext.getActionKey())
                    .mode(normalizedContext.getMode())
                    .conversationId(normalizedContext.getConversationId())
                    .messageId(normalizedContext.getMessageId())
                    .actorSub(normalizedContext.getActorSub())
                    .tenantId(normalizedContext.getTenantId())
                    .scopeType(normalizedContext.getScopeType())
                    .idempotencyKey(null)
                    .build();
                return callLlm(nextRequest, nextContext);
            });
        }
        return future;
    }

    private CompletableFuture<LlmResponse> executeWithRetry(
        NormalizedLlmRequest request,
        LlmCallContext context,
        int attempt
    ) {
        return aiProvider.call(request, context)
            .orTimeout(executionProperties.getTimeoutMs(), TimeUnit.MILLISECONDS)
            .handle((response, throwable) -> {
                if (throwable == null) {
                    return CompletableFuture.completedFuture(response);
                }

                Throwable cause = unwrap(throwable);
                if (shouldRetry(attempt, cause)) {
                    return CompletableFuture.supplyAsync(
                        () -> null,
                        CompletableFuture.delayedExecutor(executionProperties.getRetryBackoffMs(), TimeUnit.MILLISECONDS)
                    ).thenCompose(ignored -> executeWithRetry(request, context, attempt + 1));
                }

                return CompletableFuture.<LlmResponse>failedFuture(
                    new RuntimeException("LLM call failed: " + cause.getMessage(), cause)
                );
            })
            .thenCompose(Function.identity());
    }

    private boolean shouldRetry(int attempt, Throwable cause) {
        if (attempt >= executionProperties.getMaxRetries()) {
            return false;
        }
        String message = cause != null && cause.getMessage() != null
            ? cause.getMessage().toLowerCase()
            : "";
        return message.contains("timeout")
            || message.contains("429")
            || message.contains("503")
            || message.contains("504")
            || message.contains("connection reset")
            || message.contains("temporarily unavailable");
    }

    private LlmResponse onSuccess(
        LlmResponse response,
        LlmCallContext context,
        String scopeKey,
        String requestId,
        long latencyMs,
        Timer.Sample sample
    ) {
        if (response.getRequestId() == null) {
            response.setRequestId(requestId);
        }
        if (response.getCreatedAt() == null) {
            response.setCreatedAt(Instant.now());
        }
        response.setTenantId(context.getTenantId());
        response.setMode(context.getMode());
        response.setScopeType(context.getScopeType());
        response.setApplicationId(context.getApplicationId());
        response.setDomainKey(context.getDomainKey());
        response.setFeatureKey(context.getFeatureKey());
        response.setResourceKey(context.getResourceKey());
        response.setActionKey(context.getActionKey());
        response.setConversationId(context.getConversationId());
        response.setMessageId(context.getMessageId());
        response.setActorSub(context.getActorSub());

        double cost = costCalculator.calculateCost(
            response.getUsage(),
            response.getProvider(),
            response.getModel()
        );
        response.setCostUsd(cost);

        stopLatencyTimer(sample, response, context, "SUCCESS");
        saveUsageEvent(response, context, scopeKey, null, latencyMs);
        recordRequestMetric(response, context, "SUCCESS");
        return response;
    }

    private CompletableFuture<LlmResponse> onFailure(
        Throwable throwable,
        LlmCallContext context,
        String scopeKey,
        String requestId,
        long latencyMs,
        Timer.Sample sample
    ) {
        Throwable cause = unwrap(throwable);
        String errorMessage = cause.getMessage() != null ? cause.getMessage() : "Unknown LLM error";

        LlmResponse errorResponse = new LlmResponse();
        errorResponse.setRequestId(requestId);
        errorResponse.setTenantId(context.getTenantId());
        errorResponse.setProvider(aiProvider.getProviderName());
        errorResponse.setModel(UNKNOWN);
        errorResponse.setUsage(new TokenUsage(0L, 0L, 0L, true));
        errorResponse.setCostUsd(0.0);
        errorResponse.setCreatedAt(Instant.now());
        errorResponse.setMode(context.getMode());
        errorResponse.setScopeType(context.getScopeType());
        errorResponse.setApplicationId(context.getApplicationId());
        errorResponse.setDomainKey(context.getDomainKey());
        errorResponse.setFeatureKey(context.getFeatureKey());
        errorResponse.setResourceKey(context.getResourceKey());
        errorResponse.setActionKey(context.getActionKey());
        errorResponse.setConversationId(context.getConversationId());
        errorResponse.setMessageId(context.getMessageId());
        errorResponse.setActorSub(context.getActorSub());

        stopLatencyTimer(sample, errorResponse, context, "ERROR");
        saveUsageEvent(errorResponse, context, scopeKey, errorMessage, latencyMs);
        recordRequestMetric(errorResponse, context, "ERROR");

        return CompletableFuture.failedFuture(new RuntimeException(errorMessage, cause));
    }

    private Optional<AiUsageEvent> findIdempotentEvent(String scopeKey, String idempotencyKey) {
        if (idempotencyKey == null) {
            return Optional.empty();
        }
        return usageEventRepository.findByScopeKeyAndIdempotencyKey(scopeKey, idempotencyKey);
    }

    private CompletableFuture<LlmResponse> replayIdempotentEvent(AiUsageEvent event) {
        if ("SUCCESS".equals(event.getStatus())) {
            LlmResponse response = mapEventToResponse(event);
            return CompletableFuture.completedFuture(response);
        }

        String error = event.getError() != null ? event.getError() : "Previous idempotent request failed";
        return CompletableFuture.failedFuture(new RuntimeException(error));
    }

    private LlmResponse mapEventToResponse(AiUsageEvent event) {
        TokenUsage usage = new TokenUsage(
            event.getTokensIn(),
            event.getTokensOut(),
            event.getTokensTotal(),
            event.getEstimated()
        );

        return new LlmResponse(
            event.getRequestId(),
            event.getTenantId(),
            event.getProvider(),
            event.getModel(),
            event.getResponseContent(),
            usage,
            event.getCostUsd() != null ? event.getCostUsd().doubleValue() : null,
            event.getCreatedAt(),
            event.getMode(),
            event.getScopeType(),
            event.getApplicationId(),
            event.getDomainKey(),
            event.getFeatureKey(),
            event.getResourceKey(),
            event.getActionKey(),
            event.getConversationId(),
            event.getMessageId(),
            event.getActorSub(),
            null,
            LlmResponse.FinishReason.STOP
        );
    }

    private void saveUsageEvent(
        LlmResponse response,
        LlmCallContext context,
        String scopeKey,
        String error,
        long latencyMs
    ) {
        AiUsageEvent event = new AiUsageEvent();
        event.setRequestId(response.getRequestId());
        event.setTenantId(context.getTenantId());
        event.setScopeKey(scopeKey);
        event.setScopeType(context.getScopeType());
        event.setIdempotencyKey(context.getIdempotencyKey());
        event.setApplicationId(context.getApplicationId());
        event.setDomainKey(context.getDomainKey());
        event.setFeatureKey(context.getFeatureKey());
        event.setResourceKey(context.getResourceKey());
        event.setActionKey(context.getActionKey());
        event.setMode(context.getMode());
        event.setConversationId(context.getConversationId());
        event.setMessageId(context.getMessageId());
        event.setActorSub(context.getActorSub());
        event.setProvider(response.getProvider() != null ? response.getProvider() : aiProvider.getProviderName());
        event.setModel(response.getModel() != null && !response.getModel().isEmpty() ? response.getModel() : UNKNOWN);
        event.setLatencyMs(latencyMs);
        event.setResponseContent(response.getContent());

        if (response.getUsage() != null) {
            event.setTokensIn(response.getUsage().getInputTokens());
            event.setTokensOut(response.getUsage().getOutputTokens());
            event.setTokensTotal(response.getUsage().getTotalTokens());
            event.setEstimated(response.getUsage().getEstimated());
        }

        if (response.getCostUsd() != null) {
            event.setCostUsd(BigDecimal.valueOf(response.getCostUsd()));
        }

        event.setStatus(error == null ? "SUCCESS" : "ERROR");
        if (error != null && error.length() > 2000) {
            event.setError(error.substring(0, 1997) + "...");
        } else {
            event.setError(error);
        }
        event.setCreatedAt(response.getCreatedAt() != null ? response.getCreatedAt() : Instant.now());

        try {
            usageEventRepository.save(event);
        } catch (DataIntegrityViolationException e) {
            // Concurrent same idempotency-key request: keep existing row.
            if (context.getIdempotencyKey() != null) {
                usageEventRepository.findByScopeKeyAndIdempotencyKey(scopeKey, context.getIdempotencyKey());
                return;
            }
            log.warn("Failed to persist LLM usage audit event for request {}: {}", response.getRequestId(), e.getMessage());
        } catch (RuntimeException e) {
            // Audit must not fail the caller (e.g. BL extraction) when logging is misconfigured.
            log.warn("Failed to persist LLM usage audit event for request {}: {}", response.getRequestId(), e.getMessage());
        }
    }

    private void recordRequestMetric(LlmResponse response, LlmCallContext context, String status) {
        meterRegistry.ifPresent(registry ->
            Counter.builder("llm_requests_total")
                .description("Total number of LLM requests")
                .tag("provider", valueOrUnknown(response.getProvider()))
                .tag("application", valueOrUnknown(context.getApplicationId()))
                .tag("model", valueOrUnknown(response.getModel()))
                .tag("mode", context.getMode().name())
                .tag("scopeType", context.getScopeType().name())
                .tag("status", status)
                .register(registry)
                .increment()
        );
    }

    private void stopLatencyTimer(
        Timer.Sample sample,
        LlmResponse response,
        LlmCallContext context,
        String status
    ) {
        if (sample == null || meterRegistry.isEmpty()) {
            return;
        }

        sample.stop(Timer.builder("llm_request_latency_seconds")
            .description("LLM request latency")
            .tag("provider", valueOrUnknown(response.getProvider()))
            .tag("application", valueOrUnknown(context.getApplicationId()))
            .tag("model", valueOrUnknown(response.getModel()))
            .tag("mode", context.getMode().name())
            .tag("scopeType", context.getScopeType().name())
            .tag("status", status)
            .register(meterRegistry.get()));
    }

    private LlmCallContext normalizeContext(LlmCallContext context) {
        LlmCallContext source = context != null ? context : new LlmCallContext();
        LlmCallContext normalized = LlmCallContext.builder()
            .applicationId(trimToNull(source.getApplicationId()))
            .domainKey(trimToNull(source.getDomainKey()))
            .featureKey(trimToNull(source.getFeatureKey()))
            .resourceKey(trimToNull(source.getResourceKey()))
            .actionKey(trimToNull(source.getActionKey()))
            .mode(source.getMode() != null ? source.getMode() : LlmMode.ASK)
            .conversationId(trimToNull(source.getConversationId()))
            .messageId(trimToNull(source.getMessageId()))
            .actorSub(trimToNull(source.getActorSub()))
            .tenantId(trimToNull(source.getTenantId()))
            .scopeType(source.getScopeType())
            .idempotencyKey(trimToNull(source.getIdempotencyKey()))
            .build();

        if (normalized.getScopeType() == null) {
            normalized.setScopeType(normalized.getTenantId() != null ? ScopeType.TENANT : ScopeType.GLOBAL);
        }
        if (normalized.getScopeType() == ScopeType.TENANT && normalized.getTenantId() == null) {
            throw new IllegalArgumentException("tenantId is required for TENANT scope");
        }
        return normalized;
    }

    private String buildScopeKey(LlmCallContext context) {
        String application = context.getApplicationId() != null ? context.getApplicationId() : "default";
        if (context.getScopeType() == ScopeType.TENANT) {
            return "TENANT:" + application + ":" + context.getTenantId();
        }
        String actor = context.getActorSub() != null ? context.getActorSub() : "anonymous";
        return "GLOBAL:" + application + ":" + actor;
    }

    private Throwable unwrap(Throwable throwable) {
        if (throwable instanceof CompletionException && throwable.getCause() != null) {
            return throwable.getCause();
        }
        return throwable;
    }

    private String valueOrUnknown(String value) {
        return value != null && !value.isEmpty() ? value : UNKNOWN;
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}

