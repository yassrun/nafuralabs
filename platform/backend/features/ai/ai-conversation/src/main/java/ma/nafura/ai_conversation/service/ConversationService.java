package ma.nafura.platform.ai.conversation.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import ma.nafura.platform.ai.agent.service.AgentExecutionContext;
import ma.nafura.platform.ai.agent.service.tool.AgentTool;
import ma.nafura.platform.ai.agent.service.tool.AgentToolRegistry;
import ma.nafura.platform.ai.agent.service.tool.AgentToolRequest;
import ma.nafura.platform.ai.agent.service.tool.AgentToolResult;
import ma.nafura.platform.ai.conversation.api.request.CreateConversationRequest;
import ma.nafura.platform.ai.conversation.api.request.SendMessageRequest;
import ma.nafura.platform.ai.conversation.api.response.ConversationMessageResponse;
import ma.nafura.platform.ai.conversation.api.response.ConversationSessionResponse;
import ma.nafura.platform.ai.conversation.api.response.SendMessageResponse;
import ma.nafura.platform.ai.conversation.domain.model.ConversationMessage;
import ma.nafura.platform.ai.conversation.domain.model.ConversationMessageRole;
import ma.nafura.platform.ai.conversation.domain.model.ConversationSession;
import ma.nafura.platform.ai.conversation.domain.model.ConversationStatus;
import ma.nafura.platform.ai.conversation.config.SqlQueryConfig;
import ma.nafura.platform.ai.conversation.context.AiSchemaContext;
import ma.nafura.platform.ai.conversation.context.AiSchemaContextLoader;
import ma.nafura.platform.ai.conversation.context.TableSchema;
import ma.nafura.platform.ai.conversation.repository.ConversationMessageRepository;
import ma.nafura.platform.ai.conversation.repository.ConversationSessionRepository;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.stream.Collectors;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@Service
@ConditionalOnProperty(prefix = "nafura.ai.conversation", name = "enabled", havingValue = "true", matchIfMissing = true)
public class ConversationService {

    private final ConversationSessionRepository sessionRepository;
    private final ConversationMessageRepository messageRepository;
    private final ConversationIdentityResolver identityResolver;
    private final LlmService llmService;
    private final ObjectMapper objectMapper;
    private final Optional<AgentToolRegistry> agentToolRegistry;
    private final Optional<AiSchemaContextLoader> schemaLoader;
    private final Optional<SqlQueryConfig> sqlQueryConfig;

    @Value("${spring.application.name:nafura-app}")
    private String defaultApplicationId;

    public ConversationService(
        ConversationSessionRepository sessionRepository,
        ConversationMessageRepository messageRepository,
        ConversationIdentityResolver identityResolver,
        LlmService llmService,
        ObjectMapper objectMapper,
        @Autowired(required = false) AgentToolRegistry agentToolRegistry,
        @Autowired(required = false) AiSchemaContextLoader schemaLoader,
        @Autowired(required = false) SqlQueryConfig sqlQueryConfig
    ) {
        this.sessionRepository = sessionRepository;
        this.messageRepository = messageRepository;
        this.identityResolver = identityResolver;
        this.llmService = llmService;
        this.objectMapper = objectMapper;
        this.agentToolRegistry = Optional.ofNullable(agentToolRegistry);
        this.schemaLoader = Optional.ofNullable(schemaLoader);
        this.sqlQueryConfig = Optional.ofNullable(sqlQueryConfig);
    }

    @Transactional
    public ConversationSessionResponse createConversation(CreateConversationRequest request) {
        ConversationSession session = new ConversationSession();
        session.setApplicationId(resolveApplicationId(request != null ? request.getApplicationId() : null));
        session.setActorSub(identityResolver.currentActorSub());
        session.setTenantId(identityResolver.currentTenantId());
        session.setScopeType(identityResolver.currentScopeType());
        session.setMode(request != null && request.getMode() != null ? request.getMode() : LlmMode.ASK);
        session.setStatus(ConversationStatus.ACTIVE);
        session.setTitle(request != null ? trimToNull(request.getTitle()) : null);
        session.setUpdatedAt(Instant.now());
        session.setCreatedAt(Instant.now());
        return toSessionResponse(sessionRepository.save(session));
    }

    @Transactional(readOnly = true)
    public Page<ConversationSessionResponse> listConversations(String applicationId, int page, int size) {
        String resolvedAppId = resolveApplicationId(applicationId);
        String actorSub = identityResolver.currentActorSub();
        String tenantId = identityResolver.currentTenantId();
        var scopeType = identityResolver.currentScopeType();

        Page<ConversationSession> sessions;
        if (tenantId != null) {
            sessions = sessionRepository.findByApplicationIdAndActorSubAndScopeTypeAndTenantIdOrderByUpdatedAtDesc(
                resolvedAppId, actorSub, scopeType, tenantId, PageRequest.of(page, size)
            );
        } else {
            sessions = sessionRepository.findByApplicationIdAndActorSubAndScopeTypeOrderByUpdatedAtDesc(
                resolvedAppId, actorSub, scopeType, PageRequest.of(page, size)
            );
        }

        return sessions.map(this::toSessionResponse);
    }

    @Transactional(readOnly = true)
    public List<ConversationMessageResponse> listMessages(UUID conversationId, String applicationId) {
        ConversationSession session = getOwnedSession(conversationId, applicationId);
        return messageRepository.findByConversationOrderByCreatedAtAsc(session).stream()
            .map(this::toMessageResponse)
            .toList();
    }

    public CompletableFuture<SendMessageResponse> sendAskMessage(
        UUID conversationId,
        String applicationId,
        SendMessageRequest request
    ) {
        ConversationSession session = getOwnedSession(conversationId, applicationId);
        if (session.getMode() != LlmMode.ASK) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Conversation mode is not ASK. Use agent runtime for AGENT mode."
            );
        }

        ConversationMessage userMessage = persistUserMessage(session, request);
        List<ConversationTurn> history = buildConversationHistory(session);
        history.add(ConversationTurn.user(request.getContent().trim()));

        LlmRequest llmRequest = toLlmRequest(request);
        llmRequest.setConversationHistory(history);
        llmRequest.setTools(buildToolDefinitions());
        llmRequest.setToolChoice((llmRequest.getTools() == null || llmRequest.getTools().isEmpty())
            ? LlmRequest.ToolChoice.NONE
            : LlmRequest.ToolChoice.AUTO);

        Set<String> allowedDomains = getAllowedDomainsForSession(session);
        if (schemaLoader.isPresent()) {
            AiSchemaContext ctx = schemaLoader.get().getSchemaContext();
            Set<String> domains = allowedDomains.isEmpty()
                ? ctx.getTables().stream().map(TableSchema::getDomain).collect(Collectors.toSet())
                : allowedDomains;
            String schemaContext = ctx.buildLlmContext(domains);
            String baseSystem = llmRequest.getSystemInstruction();
            String withSchema = (baseSystem != null && !baseSystem.isBlank() ? baseSystem + "\n\n" : "")
                + "AVAILABLE DATABASE SCHEMA (use execute_sql to query):\n" + schemaContext;
            llmRequest.setSystemInstruction(withSchema);
        }

        LlmCallContext callContext = LlmCallContext.builder()
            .applicationId(session.getApplicationId())
            .domainKey(trimToNull(request.getDomainKey()))
            .featureKey(trimToNull(request.getFeatureKey()))
            .resourceKey(trimToNull(request.getResourceKey()))
            .actionKey(trimToNull(request.getActionKey()))
            .mode(session.getMode())
            .conversationId(session.getId().toString())
            .messageId(userMessage.getId().toString())
            .actorSub(session.getActorSub())
            .tenantId(session.getTenantId())
            .scopeType(session.getScopeType())
            .idempotencyKey(session.getId() + ":" + userMessage.getId())
            .build();

        ToolExecutor toolExecutor = createToolExecutor(session);
        CompletableFuture<LlmResponse> llmFuture = (llmRequest.getTools() != null && !llmRequest.getTools().isEmpty())
            ? llmService.callLlmWithTools(llmRequest, callContext, toolExecutor, 5)
            : llmService.callLlm(llmRequest, callContext);

        return llmFuture
            .thenApply(llmResponse -> {
                ConversationMessage assistantMessage = persistAssistantMessage(session, llmResponse);
                return SendMessageResponse.builder()
                    .conversation(toSessionResponse(session))
                    .userMessage(toMessageResponse(userMessage))
                    .assistantMessage(toMessageResponse(assistantMessage))
                    .build();
            });
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

    private List<ToolDefinition> buildToolDefinitions() {
        List<ToolDefinition> list = new ArrayList<>();
        if (sqlQueryConfig.isPresent() && Boolean.TRUE.equals(sqlQueryConfig.get().isEnabled())) {
            ObjectNode params = objectMapper.createObjectNode();
            params.put("type", "object");
            params.putArray("required").add("sql").add("explanation");
            ObjectNode props = params.putObject("properties");
            props.putObject("sql").put("type", "string").put("description", "PostgreSQL SELECT query");
            props.putObject("explanation").put("type", "string").put("description", "Why this query answers the question");
            list.add(new ToolDefinition(
                "execute_sql",
                "Execute a read-only SQL query against the database to answer business questions. Use JOINs to resolve foreign keys. Use ILIKE for case-insensitive text search.",
                params
            ));
        }
        return list;
    }

    private Set<String> getAllowedDomainsForSession(ConversationSession session) {
        return new HashSet<>();
    }

    private ToolExecutor createToolExecutor(ConversationSession session) {
        return toolCalls -> {
            if (agentToolRegistry.isEmpty()) {
                return toolCalls.stream()
                    .map(tc -> ToolResult.builder()
                        .toolCallId(tc.getId())
                        .name(tc.getName())
                        .success(false)
                        .error("No tool registry available")
                        .build())
                    .toList();
            }
            AgentExecutionContext ctx = AgentExecutionContext.builder()
                .applicationId(session.getApplicationId())
                .actorSub(session.getActorSub())
                .tenantId(session.getTenantId())
                .scopeType(session.getScopeType())
                .build();
            List<ToolResult> results = new ArrayList<>();
            for (ToolCall tc : toolCalls) {
                Optional<AgentTool> tool = agentToolRegistry.get().find(tc.getName());
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
                    String content = atRes.getPayload() != null ? toJsonString(atRes.getPayload()) : (atRes.getMessage() != null ? atRes.getMessage() : "{}");
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

    private Map<String, Object> jsonNodeToMap(JsonNode node) {
        if (node == null || node.isNull()) {
            return new HashMap<>();
        }
        try {
            return objectMapper.convertValue(node, Map.class);
        } catch (Exception e) {
            return new HashMap<>();
        }
    }

    private String toJsonString(Object o) {
        try {
            return objectMapper.writeValueAsString(o);
        } catch (JsonProcessingException e) {
            return "{}";
        }
    }

    @Transactional
    protected ConversationMessage persistUserMessage(ConversationSession session, SendMessageRequest request) {
        ConversationMessage message = new ConversationMessage();
        message.setConversation(session);
        message.setRole(ConversationMessageRole.USER);
        message.setContent(request.getContent().trim());
        message.setMetadataJson(toJson(request.getMetadata()));
        message.setCreatedAt(Instant.now());
        session.setUpdatedAt(Instant.now());
        sessionRepository.save(session);
        return messageRepository.save(message);
    }

    @Transactional
    protected ConversationMessage persistAssistantMessage(ConversationSession session, LlmResponse llmResponse) {
        ConversationMessage message = new ConversationMessage();
        message.setConversation(session);
        message.setRole(ConversationMessageRole.ASSISTANT);
        message.setContent(llmResponse.getContent() != null ? llmResponse.getContent() : "");
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

    private LlmRequest toLlmRequest(SendMessageRequest request) {
        LlmRequest llmRequest = new LlmRequest();
        llmRequest.setPrompt(request.getContent());
        llmRequest.setSystemInstruction(trimToNull(request.getSystemInstruction()));
        llmRequest.setResponseSchema(trimToNull(request.getResponseSchema()));
        llmRequest.setMetadata(request.getMetadata() != null ? request.getMetadata() : Map.of());
        llmRequest.setMode(LlmMode.ASK);
        return llmRequest;
    }

    private String resolveApplicationId(String requestApplicationId) {
        String candidate = trimToNull(requestApplicationId);
        if (candidate != null) {
            return candidate;
        }
        return trimToNull(defaultApplicationId) != null ? trimToNull(defaultApplicationId) : "nafura-app";
    }

    private String toJson(Map<String, Object> metadata) {
        if (metadata == null || metadata.isEmpty()) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(metadata);
        } catch (JsonProcessingException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid metadata payload");
        }
    }

    private ConversationSessionResponse toSessionResponse(ConversationSession session) {
        return ConversationSessionResponse.builder()
            .id(session.getId())
            .applicationId(session.getApplicationId())
            .title(session.getTitle())
            .mode(session.getMode())
            .scopeType(session.getScopeType())
            .status(session.getStatus())
            .createdAt(session.getCreatedAt())
            .updatedAt(session.getUpdatedAt())
            .build();
    }

    private ConversationMessageResponse toMessageResponse(ConversationMessage message) {
        return ConversationMessageResponse.builder()
            .id(message.getId())
            .role(message.getRole())
            .content(message.getContent())
            .requestId(message.getRequestId())
            .costUsd(message.getCostUsd() != null ? message.getCostUsd().doubleValue() : null)
            .tokensIn(message.getTokensIn())
            .tokensOut(message.getTokensOut())
            .tokensTotal(message.getTokensTotal())
            .createdAt(message.getCreatedAt())
            .build();
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}


