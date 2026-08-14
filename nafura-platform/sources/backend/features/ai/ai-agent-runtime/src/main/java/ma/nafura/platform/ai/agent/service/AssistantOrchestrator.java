package ma.nafura.platform.ai.agent.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;
import lombok.RequiredArgsConstructor;
import ma.nafura.platform.ai.agent.api.request.AgentProposeRequest;
import ma.nafura.platform.ai.agent.api.request.AssistantTurnRequest;
import ma.nafura.platform.ai.agent.api.response.AgentProposeResponse;
import ma.nafura.platform.ai.agent.api.response.AssistantTurnResponse;
import ma.nafura.platform.ai.agent.model.AssistantBlock;
import ma.nafura.platform.ai.agent.model.AssistantLink;
import ma.nafura.platform.ai.agent.model.IntentClassification;
import ma.nafura.platform.ai.agent.model.IntentType;
import ma.nafura.platform.ai.agent.service.compose.AssistantBlockComposer;
import ma.nafura.platform.ai.agent.service.intent.IntentRouter;
import ma.nafura.platform.ai.agent.service.intent.IntentToolSelector;
import ma.nafura.platform.ai.agent.service.prompt.AssistantPromptProvider;
import ma.nafura.platform.ai.agent.service.tool.AgentTool;
import ma.nafura.platform.ai.agent.service.tool.AgentToolRegistry;
import ma.nafura.platform.ai.agent.service.tool.AgentToolRequest;
import ma.nafura.platform.ai.agent.service.tool.AgentToolResult;
import ma.nafura.platform.ai.conversation.config.SqlQueryConfig;
import ma.nafura.platform.ai.conversation.context.AiSchemaContext;
import ma.nafura.platform.ai.conversation.context.AiSchemaContextLoader;
import ma.nafura.platform.ai.conversation.domain.model.ConversationMessage;
import ma.nafura.platform.ai.conversation.domain.model.ConversationMessageRole;
import ma.nafura.platform.ai.conversation.domain.model.ConversationSession;
import ma.nafura.platform.ai.conversation.repository.ConversationMessageRepository;
import ma.nafura.platform.ai.conversation.repository.ConversationSessionRepository;
import ma.nafura.platform.ai.conversation.service.ConversationIdentityResolver;
import ma.nafura.platform.ai.conversation.service.ConversationTitleService;
import ma.nafura.platform.ai.llm.model.ConversationTurn;
import ma.nafura.platform.ai.llm.model.LlmCallContext;
import ma.nafura.platform.ai.llm.model.LlmMode;
import ma.nafura.platform.ai.llm.model.LlmRequest;
import ma.nafura.platform.ai.llm.model.LlmResponse;
import ma.nafura.platform.ai.llm.model.ToolCall;
import ma.nafura.platform.ai.llm.model.ToolDefinition;
import ma.nafura.platform.ai.llm.model.ToolResult;
import ma.nafura.platform.ai.llm.service.LlmService;
import ma.nafura.platform.ai.llm.service.ToolExecutor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "nafura.ai.assistant", name = "unified", havingValue = "true", matchIfMissing = true)
public class AssistantOrchestrator {

    private final ConversationSessionRepository sessionRepository;
    private final ConversationMessageRepository messageRepository;
    private final ConversationIdentityResolver identityResolver;
    private final ConversationTitleService conversationTitleService;
    private final LlmService llmService;
    private final ObjectMapper objectMapper;
    private final IntentRouter intentRouter;
    private final IntentToolSelector intentToolSelector;
    private final AssistantBlockComposer blockComposer;
    private final AgentToolRegistry toolRegistry;
    private final AgentRuntimeService agentRuntimeService;
    private final List<AssistantPromptProvider> promptProviders;

    @Autowired(required = false)
    private AiSchemaContextLoader schemaLoader;

    @Autowired(required = false)
    private SqlQueryConfig sqlQueryConfig;

    @Value("${spring.application.name:nafura-app}")
    private String defaultApplicationId;

    public CompletableFuture<AssistantTurnResponse> processTurn(
            UUID conversationId,
            String applicationId,
            AssistantTurnRequest request
    ) {
        ConversationSession session = getOwnedSession(conversationId, applicationId);
        IntentClassification classification = intentRouter.classify(request.getContent());

        if (classification.getIntent() == IntentType.ACTION) {
            return CompletableFuture.completedFuture(processActionTurn(session, applicationId, request, classification));
        }

        return processReadOrNavigateTurn(session, request, classification);
    }

    private AssistantTurnResponse processActionTurn(
            ConversationSession session,
            String applicationId,
            AssistantTurnRequest request,
            IntentClassification classification
    ) {
        AgentProposeRequest proposeRequest = new AgentProposeRequest();
        proposeRequest.setContent(request.getContent());
        proposeRequest.setSystemInstruction(request.getSystemInstruction());
        proposeRequest.setMetadata(enrichMetadata(request));
        proposeRequest.setDomainKey(request.getDomainKey());
        proposeRequest.setFeatureKey(request.getFeatureKey());
        proposeRequest.setResourceKey(request.getResourceKey());
        proposeRequest.setActionKey(request.getActionKey());

        AgentProposeResponse proposeResponse = agentRuntimeService.proposeActionsForAssistantSession(
                session,
                applicationId,
                proposeRequest
        );

        List<AssistantBlock> blocks = new ArrayList<>();
        if (proposeResponse.getAssistantMessage() != null
                && proposeResponse.getAssistantMessage().getContent() != null) {
            blocks.add(blockComposer.textBlock(proposeResponse.getAssistantMessage().getContent()));
        }
        if (proposeResponse.getActions() != null) {
            for (var action : proposeResponse.getActions()) {
                blocks.add(AssistantBlock.builder()
                        .type(ma.nafura.platform.ai.agent.model.AssistantBlockType.ACTION)
                        .title(action.getTitle())
                        .content(action.getTitle())
                        .data(Map.of(
                                "actionId", action.getId().toString(),
                                "toolKey", action.getToolKey(),
                                "status", action.getStatus().name(),
                                "requiresApproval", action.isRequiresApproval()
                        ))
                        .build());
            }
        }

        return AssistantTurnResponse.builder()
                .intent(classification.getIntent())
                .summary(proposeResponse.getAssistantMessage() != null
                        ? proposeResponse.getAssistantMessage().getContent()
                        : null)
                .blocks(blocks)
                .links(List.of())
                .actions(proposeResponse.getActions())
                .run(proposeResponse.getRun())
                .userMessage(proposeResponse.getUserMessage())
                .assistantMessage(proposeResponse.getAssistantMessage())
                .build();
    }

    private CompletableFuture<AssistantTurnResponse> processReadOrNavigateTurn(
            ConversationSession session,
            AssistantTurnRequest request,
            IntentClassification classification
    ) {
        ConversationMessage userMessage = persistUserMessage(session, request);
        List<ConversationTurn> history = buildConversationHistory(session);
        history.add(ConversationTurn.user(request.getContent().trim()));

        List<AgentToolResult> capturedToolResults = new ArrayList<>();
        LlmRequest llmRequest = buildLlmRequest(request, classification, history);
        LlmCallContext callContext = buildCallContext(session, userMessage, request);
        ConversationSession activeSession = session;

        ToolExecutor toolExecutor = createToolExecutor(session, capturedToolResults);
        CompletableFuture<LlmResponse> llmFuture = llmService.callLlmWithTools(llmRequest, callContext, toolExecutor, 5);

        return llmFuture.thenApply(llmResponse -> {
            List<AssistantBlock> blocks = new ArrayList<>();
            List<AssistantLink> links = new ArrayList<>();
            String summary = llmResponse.getContent() != null ? llmResponse.getContent() : "";

            for (AgentToolResult agentResult : capturedToolResults) {
                blocks.addAll(blockComposer.fromToolResult(agentResult));
                if (agentResult.getPayload() != null) {
                    links.addAll(blockComposer.linksFromPayload(agentResult.getPayload()));
                }
            }

            if (blocks.isEmpty() && summary != null && !summary.isBlank()) {
                blocks.add(blockComposer.textBlock(summary));
            }

            ConversationMessage assistantMessage = persistAssistantMessage(activeSession, llmResponse, summary);
            conversationTitleService.maybeGenerateTitle(
                    activeSession,
                    request.getContent().trim(),
                    summary,
                    callContext
            );

            return AssistantTurnResponse.builder()
                    .intent(classification.getIntent())
                    .summary(summary)
                    .blocks(blocks)
                    .links(links)
                    .actions(List.of())
                    .userMessage(toMessageResponse(userMessage))
                    .assistantMessage(toMessageResponse(assistantMessage))
                    .build();
        });
    }

    private LlmRequest buildLlmRequest(
            AssistantTurnRequest request,
            IntentClassification classification,
            List<ConversationTurn> history
    ) {
        LlmRequest llmRequest = new LlmRequest();
        llmRequest.setPrompt(request.getContent().trim());
        llmRequest.setConversationHistory(history);
        llmRequest.setMode(LlmMode.ASSISTANT);
        llmRequest.setMetadata(enrichMetadata(request));

        String system = trimToNull(request.getSystemInstruction());
        if (system == null) {
            system = resolvePrompt(AssistantPromptProvider::assistantSystemInstruction);
        }
        if (classification.getIntent() == IntentType.READ && schemaLoader != null) {
            String sqlRules = resolvePrompt(AssistantPromptProvider::sqlReadRules);
            if (sqlRules != null) {
                AiSchemaContext ctx = schemaLoader.getSchemaContext();
                int maxTables = sqlQueryConfig != null ? sqlQueryConfig.getMaxTablesInPrompt() : 15;
                system = (system != null ? system + "\n\n" : "") + sqlRules
                        + "\n\nAVAILABLE DATABASE SCHEMA:\n"
                        + ctx.buildLlmContext(java.util.Set.of(), maxTables);
            }
        }
        llmRequest.setSystemInstruction(system);
        llmRequest.setTools(intentToolSelector.toolsFor(classification.getIntent()));
        llmRequest.setToolChoice(LlmRequest.ToolChoice.AUTO);
        return llmRequest;
    }

    private Map<String, Object> enrichMetadata(AssistantTurnRequest request) {
        Map<String, Object> metadata = new HashMap<>();
        if (request.getMetadata() != null) {
            metadata.putAll(request.getMetadata());
        }
        if (request.getCurrentRoute() != null) {
            metadata.put("currentRoute", request.getCurrentRoute());
        }
        if (request.getEntityType() != null) {
            metadata.put("entityType", request.getEntityType());
        }
        if (request.getEntityId() != null) {
            metadata.put("entityId", request.getEntityId());
        }
        return metadata;
    }

    private LlmCallContext buildCallContext(
            ConversationSession session,
            ConversationMessage userMessage,
            AssistantTurnRequest request
    ) {
        return LlmCallContext.builder()
                .applicationId(session.getApplicationId())
                .domainKey(trimToNull(request.getDomainKey()))
                .featureKey(trimToNull(request.getFeatureKey()))
                .resourceKey(trimToNull(request.getResourceKey()))
                .actionKey(trimToNull(request.getActionKey()))
                .mode(LlmMode.ASSISTANT)
                .conversationId(session.getId().toString())
                .messageId(userMessage.getId().toString())
                .actorSub(session.getActorSub())
                .tenantId(session.getTenantId())
                .scopeType(session.getScopeType())
                .idempotencyKey(session.getId() + ":" + userMessage.getId() + ":assistant:turn")
                .build();
    }

    private ToolExecutor createToolExecutor(ConversationSession session, List<AgentToolResult> capturedResults) {
        return toolCalls -> {
            AgentExecutionContext ctx = AgentExecutionContext.builder()
                    .applicationId(session.getApplicationId())
                    .actorSub(session.getActorSub())
                    .tenantId(session.getTenantId())
                    .scopeType(session.getScopeType())
                    .build();
            List<ToolResult> results = new ArrayList<>();
            for (ToolCall tc : toolCalls) {
                Optional<AgentTool> tool = toolRegistry.find(tc.getName());
                if (tool.isEmpty()) {
                    results.add(ToolResult.builder()
                            .toolCallId(tc.getId())
                            .name(tc.getName())
                            .success(false)
                            .error("Unknown tool: " + tc.getName())
                            .build());
                    continue;
                }
                Map<String, Object> args = jsonNodeToMap(tc.getArguments());
                AgentToolRequest atReq = AgentToolRequest.builder()
                        .conversationId(session.getId().toString())
                        .actionId(tc.getId())
                        .actorSub(session.getActorSub())
                        .tenantId(session.getTenantId())
                        .arguments(args != null ? args : Map.of())
                        .build();
                try {
                    AgentToolResult atRes = tool.get().execute(atReq, ctx);
                    capturedResults.add(atRes);
                    String content = atRes.getPayload() != null
                            ? toJson(atRes.getPayload())
                            : (atRes.getMessage() != null ? atRes.getMessage() : "{}");
                    results.add(ToolResult.builder()
                            .toolCallId(tc.getId())
                            .name(tc.getName())
                            .content(content)
                            .success(atRes.isSuccess())
                            .error(atRes.isSuccess() ? null : atRes.getMessage())
                            .build());
                } catch (Exception e) {
                    results.add(ToolResult.builder()
                            .toolCallId(tc.getId())
                            .name(tc.getName())
                            .success(false)
                            .error(e.getMessage() != null ? e.getMessage() : "Tool execution failed")
                            .build());
                }
            }
            return results;
        };
    }

    @Transactional
    protected ConversationMessage persistUserMessage(ConversationSession session, AssistantTurnRequest request) {
        ConversationMessage message = new ConversationMessage();
        message.setConversation(session);
        message.setRole(ConversationMessageRole.USER);
        message.setContent(request.getContent().trim());
        message.setMetadataJson(toJson(enrichMetadata(request)));
        message.setCreatedAt(Instant.now());
        session.setUpdatedAt(Instant.now());
        sessionRepository.save(session);
        return messageRepository.save(message);
    }

    @Transactional
    protected ConversationMessage persistAssistantMessage(
            ConversationSession session,
            LlmResponse llmResponse,
            String content
    ) {
        ConversationMessage message = new ConversationMessage();
        message.setConversation(session);
        message.setRole(ConversationMessageRole.ASSISTANT);
        message.setContent(content != null ? content : "");
        message.setRequestId(llmResponse.getRequestId());
        if (llmResponse.getUsage() != null) {
            message.setTokensIn(llmResponse.getUsage().getInputTokens());
            message.setTokensOut(llmResponse.getUsage().getOutputTokens());
            message.setTokensTotal(llmResponse.getUsage().getTotalTokens());
        }
        if (llmResponse.getCostUsd() != null) {
            message.setCostUsd(BigDecimal.valueOf(llmResponse.getCostUsd()));
        }
        message.setCreatedAt(Instant.now());
        session.setUpdatedAt(Instant.now());
        sessionRepository.save(session);
        return messageRepository.save(message);
    }

    private List<ConversationTurn> buildConversationHistory(ConversationSession session) {
        List<ConversationMessage> messages = messageRepository.findByConversationOrderByCreatedAtAsc(session);
        List<ConversationTurn> turns = new ArrayList<>();
        for (ConversationMessage m : messages) {
            if (m.getRole() == ConversationMessageRole.USER) {
                turns.add(ConversationTurn.user(m.getContent()));
            } else if (m.getRole() == ConversationMessageRole.ASSISTANT) {
                turns.add(ConversationTurn.assistant(m.getContent() != null ? m.getContent() : ""));
            }
        }
        return turns;
    }

    @Transactional(readOnly = true)
    protected ConversationSession getOwnedSession(UUID conversationId, String applicationId) {
        String actorSub = identityResolver.currentActorSub();
        String resolvedAppId = resolveApplicationId(applicationId);

        ConversationSession session = sessionRepository
                .findByIdAndApplicationIdAndActorSub(conversationId, resolvedAppId, actorSub)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Conversation not found"));

        String currentTenant = identityResolver.currentTenantId();
        if (session.getTenantId() != null && !session.getTenantId().equals(currentTenant)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Conversation tenant scope mismatch");
        }
        if (session.getTenantId() == null && currentTenant != null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Conversation scope mismatch");
        }
        return session;
    }

    private ma.nafura.platform.ai.agent.api.response.AgentMessageResponse toMessageResponse(ConversationMessage message) {
        return ma.nafura.platform.ai.agent.api.response.AgentMessageResponse.builder()
                .id(message.getId())
                .role(message.getRole())
                .content(message.getContent())
                .requestId(message.getRequestId())
                .createdAt(message.getCreatedAt())
                .build();
    }

    private String resolvePrompt(java.util.function.Function<AssistantPromptProvider, String> extractor) {
        for (AssistantPromptProvider provider : promptProviders) {
            if (!(provider instanceof ma.nafura.platform.ai.agent.service.prompt.DefaultAssistantPromptProvider)) {
                String value = extractor.apply(provider);
                if (trimToNull(value) != null) {
                    return value;
                }
            }
        }
        return promptProviders.stream()
                .map(extractor)
                .filter(v -> trimToNull(v) != null)
                .findFirst()
                .orElse(null);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> jsonNodeToMap(com.fasterxml.jackson.databind.JsonNode node) {
        if (node == null || node.isNull()) {
            return new HashMap<>();
        }
        return objectMapper.convertValue(node, Map.class);
    }

    private String resolveApplicationId(String requestApplicationId) {
        String candidate = trimToNull(requestApplicationId);
        if (candidate != null) {
            return candidate;
        }
        return trimToNull(defaultApplicationId) != null ? trimToNull(defaultApplicationId) : "nafura-app";
    }

    private String toJson(Object payload) {
        if (payload == null) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid JSON payload");
        }
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
