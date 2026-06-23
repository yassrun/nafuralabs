package ma.nafura.platform.ai.agent.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import ma.nafura.platform.ai.agent.api.request.AgentDecisionRequest;
import ma.nafura.platform.ai.agent.api.request.AgentProposeRequest;
import ma.nafura.platform.ai.agent.api.response.AgentActionResponse;
import ma.nafura.platform.ai.agent.api.response.AgentMessageResponse;
import ma.nafura.platform.ai.agent.api.response.AgentProposeResponse;
import ma.nafura.platform.ai.agent.api.response.AgentRunResponse;
import ma.nafura.platform.ai.agent.domain.model.AgentAction;
import ma.nafura.platform.ai.agent.domain.model.AgentActionStatus;
import ma.nafura.platform.ai.agent.domain.model.AgentApproval;
import ma.nafura.platform.ai.agent.domain.model.AgentApprovalDecision;
import ma.nafura.platform.ai.agent.domain.model.AgentExecutionLog;
import ma.nafura.platform.ai.agent.domain.model.AgentExecutionPhase;
import ma.nafura.platform.ai.agent.domain.model.AgentRun;
import ma.nafura.platform.ai.agent.domain.model.AgentRunStatus;
import ma.nafura.platform.ai.agent.repository.AgentActionRepository;
import ma.nafura.platform.ai.agent.repository.AgentApprovalRepository;
import ma.nafura.platform.ai.agent.repository.AgentExecutionLogRepository;
import ma.nafura.platform.ai.agent.repository.AgentRunRepository;
import ma.nafura.platform.ai.agent.service.model.AgentProposalAction;
import ma.nafura.platform.ai.agent.service.model.AgentProposalPayload;
import ma.nafura.platform.ai.agent.service.tool.AgentTool;
import ma.nafura.platform.ai.agent.service.tool.AgentPermissionDeniedException;
import ma.nafura.platform.ai.agent.service.tool.AgentToolRegistry;
import ma.nafura.platform.ai.agent.service.tool.AgentToolRequest;
import ma.nafura.platform.ai.agent.service.tool.AgentToolResult;
import ma.nafura.platform.ai.agent.service.tool.AgentToolDescriptions;
import ma.nafura.platform.ai.conversation.domain.model.ConversationMessage;
import ma.nafura.platform.ai.conversation.domain.model.ConversationMessageRole;
import ma.nafura.platform.ai.conversation.domain.model.ConversationSession;
import ma.nafura.platform.ai.conversation.repository.ConversationMessageRepository;
import ma.nafura.platform.ai.conversation.repository.ConversationSessionRepository;
import ma.nafura.platform.ai.conversation.service.ConversationIdentityResolver;
import ma.nafura.platform.subscription.domain.model.SubscriptionAssignmentOwnerType;
import ma.nafura.platform.subscription.service.SubscriptionEntitlementService;
import ma.nafura.platform.framework.context.UserContext;
import ma.nafura.platform.ai.llm.model.LlmCallContext;
import ma.nafura.platform.ai.llm.model.LlmMode;
import ma.nafura.platform.ai.llm.model.LlmRequest;
import ma.nafura.platform.ai.llm.model.LlmResponse;
import ma.nafura.platform.ai.llm.service.LlmService;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.concurrent.CompletionException;

@Service
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "nafura.ai.agent-runtime", name = "enabled", havingValue = "true", matchIfMissing = true)
public class AgentRuntimeService {
    private static final String AGENT_RESPONSE_SCHEMA = """
        {
          "type": "object",
          "properties": {
            "summary": { "type": "string" },
            "actions": {
              "type": "array",
              "items": {
                "type": "object",
                "required": ["toolKey"],
                "properties": {
                  "toolKey": { "type": "string" },
                  "title": { "type": "string" },
                  "actionKey": { "type": "string" },
                  "permissionKey": { "type": "string" },
                  "entitlementKey": { "type": "string" },
                  "requiresApproval": { "type": "boolean" },
                  "args": { "type": "object" }
                }
              }
            }
          },
          "required": ["actions"]
        }
        """;

    private final AgentRunRepository runRepository;
    private final AgentActionRepository actionRepository;
    private final AgentApprovalRepository approvalRepository;
    private final AgentExecutionLogRepository executionLogRepository;
    private final ConversationSessionRepository sessionRepository;
    private final ConversationMessageRepository messageRepository;
    private final ConversationIdentityResolver identityResolver;
    private final LlmService llmService;
    private final AgentToolRegistry toolRegistry;
    private final AgentToolDescriptions agentToolDescriptions;
    private final ObjectMapper objectMapper;
    private final ObjectProvider<SubscriptionEntitlementService> entitlementServiceProvider;

    @Value("${spring.application.name:nafura-app}")
    private String defaultApplicationId;

    public AgentProposeResponse proposeActions(
        UUID conversationId,
        String applicationId,
        AgentProposeRequest request
    ) {
        ConversationSession session = getOwnedAgentConversation(conversationId, applicationId);
        ConversationMessage userMessage = persistConversationMessage(
            session,
            ConversationMessageRole.USER,
            request.getContent().trim(),
            null
        );

        LlmResponse llmResponse;
        try {
            llmResponse = llmService.callLlm(
                toAgentLlmRequest(request),
                LlmCallContext.builder()
                    .applicationId(session.getApplicationId())
                    .domainKey(trimToNull(request.getDomainKey()))
                    .featureKey(trimToNull(request.getFeatureKey()))
                    .resourceKey(trimToNull(request.getResourceKey()))
                    .actionKey(trimToNull(request.getActionKey()))
                    .mode(LlmMode.AGENT)
                    .conversationId(session.getId().toString())
                    .messageId(userMessage.getId().toString())
                    .actorSub(session.getActorSub())
                    .tenantId(session.getTenantId())
                    .scopeType(session.getScopeType())
                    .idempotencyKey(session.getId() + ":" + userMessage.getId() + ":agent:propose")
                    .build()
            ).join();
        } catch (CompletionException ex) {
            String error = rootMessage(ex);
            AgentRun failedRun = createFailedRun(session, request.getContent(), error);
            throw new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                "Agent planner failed. RunId=" + failedRun.getId() + ", error=" + error
            );
        }

        ConversationMessage assistantMessage = persistConversationMessage(
            session,
            ConversationMessageRole.ASSISTANT,
            llmResponse.getContent() != null ? llmResponse.getContent() : "",
            llmResponse.getRequestId()
        );

        AgentProposalPayload payload;
        try {
            payload = parseProposalPayload(llmResponse);
        } catch (ResponseStatusException ex) {
            AgentRun failedRun = createFailedRun(session, request.getContent(), ex.getReason());
            throw new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                "Agent planner returned invalid proposal. RunId=" + failedRun.getId()
            );
        }
        if (payload.getActions() == null || payload.getActions().isEmpty()) {
            AgentRun failedRun = createFailedRun(session, request.getContent(), "Planner returned no actions");
            return AgentProposeResponse.builder()
                .run(toRunResponse(failedRun))
                .actions(List.of())
                .userMessage(toMessageResponse(userMessage))
                .assistantMessage(toMessageResponse(assistantMessage))
                .build();
        }

        AgentRun run = new AgentRun();
        run.setConversation(session);
        run.setApplicationId(session.getApplicationId());
        run.setTenantId(session.getTenantId());
        run.setActorSub(session.getActorSub());
        run.setScopeType(session.getScopeType());
        run.setPrompt(request.getContent());
        run.setModel(llmResponse.getModel());
        run.setLlmRequestId(llmResponse.getRequestId());
        run.setLlmCostUsd(
            llmResponse.getCostUsd() != null ? BigDecimal.valueOf(llmResponse.getCostUsd()) : null
        );
        run.setStatus(AgentRunStatus.PROPOSED);
        run = runRepository.save(run);

        List<AgentAction> actions = new ArrayList<>();
        boolean hasPendingApproval = false;
        for (AgentProposalAction proposedAction : payload.getActions()) {
            if (trimToNull(proposedAction.getToolKey()) == null) {
                continue;
            }
            AgentAction action = new AgentAction();
            action.setRun(run);
            action.setConversation(session);
            action.setAssistantMessage(assistantMessage);
            action.setToolKey(proposedAction.getToolKey().trim().toLowerCase());
            action.setTitle(trimToNull(proposedAction.getTitle()));
            action.setActionKey(trimToNull(proposedAction.getActionKey()));
            action.setPermissionKey(trimToNull(proposedAction.getPermissionKey()));
            action.setEntitlementKey(trimToNull(proposedAction.getEntitlementKey()));
            action.setRequiresApproval(!Boolean.FALSE.equals(proposedAction.getRequiresApproval()));
            action.setArgsJson(toJson(proposedAction.getArgs()));
            action.setStatus(action.getRequiresApproval()
                ? AgentActionStatus.PENDING_APPROVAL
                : AgentActionStatus.PROPOSED);
            actions.add(actionRepository.save(action));
            if (action.getStatus() == AgentActionStatus.PENDING_APPROVAL) {
                hasPendingApproval = true;
            }
        }

        if (actions.isEmpty()) {
            run.setStatus(AgentRunStatus.FAILED);
            run.setError("Planner returned actions without valid toolKey");
        } else {
            run.setStatus(hasPendingApproval ? AgentRunStatus.PENDING_APPROVAL : AgentRunStatus.PROPOSED);
        }
        run = runRepository.save(run);

        return AgentProposeResponse.builder()
            .run(toRunResponse(run))
            .actions(actions.stream().map(this::toActionResponse).toList())
            .userMessage(toMessageResponse(userMessage))
            .assistantMessage(toMessageResponse(assistantMessage))
            .build();
    }

    public List<AgentActionResponse> listConversationActions(UUID conversationId, String applicationId) {
        ConversationSession session = getOwnedAgentConversation(conversationId, applicationId);
        return actionRepository.findByConversationOrderByCreatedAtDesc(session).stream()
            .map(this::toActionResponse)
            .toList();
    }

    public AgentActionResponse approveAction(
        UUID conversationId,
        UUID actionId,
        String applicationId,
        AgentDecisionRequest request
    ) {
        AgentAction action = getOwnedAction(conversationId, actionId, applicationId);
        if (action.getStatus() == AgentActionStatus.REJECTED || action.getStatus() == AgentActionStatus.EXECUTED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Action is already finalized");
        }
        action.setStatus(AgentActionStatus.APPROVED);
        action = actionRepository.save(action);
        recordApproval(action, AgentApprovalDecision.APPROVED, request != null ? request.getComment() : null);
        refreshRunStatus(action.getRun());
        return toActionResponse(action);
    }

    public AgentActionResponse rejectAction(
        UUID conversationId,
        UUID actionId,
        String applicationId,
        AgentDecisionRequest request
    ) {
        AgentAction action = getOwnedAction(conversationId, actionId, applicationId);
        if (action.getStatus() == AgentActionStatus.EXECUTED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Executed action cannot be rejected");
        }
        action.setStatus(AgentActionStatus.REJECTED);
        action = actionRepository.save(action);
        recordApproval(action, AgentApprovalDecision.REJECTED, request != null ? request.getComment() : null);
        refreshRunStatus(action.getRun());
        return toActionResponse(action);
    }

    public AgentActionResponse executeAction(UUID conversationId, UUID actionId, String applicationId) {
        AgentAction action = getOwnedAction(conversationId, actionId, applicationId);
        if (!(action.getStatus() == AgentActionStatus.APPROVED || action.getStatus() == AgentActionStatus.PROPOSED)) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Action must be APPROVED (or PROPOSED when no approval required) before execution"
            );
        }
        enforcePolicyGate(action);

        Map<String, Object> args = parseArgs(action.getArgsJson());
        Map<String, Object> requestPayload = new LinkedHashMap<>();
        requestPayload.put("toolKey", action.getToolKey());
        requestPayload.put("args", args);
        requestPayload.put("actorSub", action.getConversation().getActorSub());
        requestPayload.put("tenantId", action.getConversation().getTenantId());
        logExecution(action, AgentExecutionPhase.REQUEST, requestPayload);

        String toolKey = action.getToolKey();
        AgentTool tool = toolRegistry.find(toolKey)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "No tool registered for key: " + toolKey
            ));

        try {
            AgentToolResult result = tool.execute(
                AgentToolRequest.builder()
                    .conversationId(action.getConversation().getId().toString())
                    .actionId(action.getId().toString())
                    .actorSub(action.getConversation().getActorSub())
                    .tenantId(action.getConversation().getTenantId())
                    .arguments(args)
                    .build(),
                AgentExecutionContext.builder()
                    .applicationId(action.getConversation().getApplicationId())
                    .actorSub(action.getConversation().getActorSub())
                    .tenantId(action.getConversation().getTenantId())
                    .scopeType(action.getConversation().getScopeType())
                    .build()
            );

            Map<String, Object> resultPayload = new LinkedHashMap<>();
            resultPayload.put("success", result.isSuccess());
            resultPayload.put("message", result.getMessage());
            resultPayload.put("payload", result.getPayload() != null ? result.getPayload() : Map.of());

            action.setResultJson(toJson(resultPayload));
            action.setStatus(result.isSuccess() ? AgentActionStatus.EXECUTED : AgentActionStatus.FAILED);
            action.setError(result.isSuccess() ? null : result.getMessage());
            action = actionRepository.save(action);
            logExecution(action, AgentExecutionPhase.RESULT, resultPayload);
            refreshRunStatus(action.getRun());
            return toActionResponse(action);
        } catch (AgentPermissionDeniedException denied) {
            String error = denied.getMessage() != null ? denied.getMessage() : "Permission denied";
            action.setStatus(AgentActionStatus.FAILED);
            action.setError(error);
            action = actionRepository.save(action);
            logExecution(action, AgentExecutionPhase.ERROR, Map.of("error", error));
            refreshRunStatus(action.getRun());
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, error);
        } catch (Exception ex) {
            String error = rootMessage(ex);
            action.setStatus(AgentActionStatus.FAILED);
            action.setError(error);
            action = actionRepository.save(action);
            logExecution(action, AgentExecutionPhase.ERROR, Map.of("error", error));
            refreshRunStatus(action.getRun());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Action execution failed: " + error);
        }
    }

    private void enforcePolicyGate(AgentAction action) {
        String permissionKey = trimToNull(action.getPermissionKey());
        if (permissionKey != null && !UserContext.hasPermission(permissionKey)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Permission denied: " + permissionKey);
        }

        String entitlementKey = trimToNull(action.getEntitlementKey());
        if (entitlementKey == null) {
            return;
        }

        SubscriptionEntitlementService entitlementService = entitlementServiceProvider.getIfAvailable();
        if (entitlementService == null) {
            throw new ResponseStatusException(
                HttpStatus.PRECONDITION_FAILED,
                "Entitlement policy requested but subscription service is unavailable"
            );
        }

        SubscriptionAssignmentOwnerType ownerType;
        UUID ownerId;
        if (action.getConversation().getTenantId() != null) {
            ownerType = SubscriptionAssignmentOwnerType.TENANT;
            try {
                ownerId = UUID.fromString(action.getConversation().getTenantId());
            } catch (IllegalArgumentException ex) {
                throw new ResponseStatusException(
                    HttpStatus.PRECONDITION_FAILED,
                    "Tenant context must be a UUID for entitlement checks"
                );
            }
        } else {
            ownerType = SubscriptionAssignmentOwnerType.USER;
            ownerId = UserContext.getUserIdOrNull();
            if (ownerId == null) {
                throw new ResponseStatusException(
                    HttpStatus.PRECONDITION_FAILED,
                    "Entitlement owner USER requires authenticated user id"
                );
            }
        }

        boolean entitled = entitlementService.isEntitled(
            action.getConversation().getApplicationId(),
            ownerType,
            ownerId,
            entitlementKey
        );
        if (!entitled) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Entitlement denied: " + entitlementKey);
        }
    }

    private AgentAction getOwnedAction(UUID conversationId, UUID actionId, String applicationId) {
        ConversationSession session = getOwnedAgentConversation(conversationId, applicationId);
        AgentAction action = actionRepository.findByIdAndConversation_Id(actionId, session.getId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Agent action not found"));

        if (!Objects.equals(action.getConversation().getId(), session.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Agent action does not belong to conversation");
        }
        return action;
    }

    private ConversationSession getOwnedAgentConversation(UUID conversationId, String applicationId) {
        String actorSub = identityResolver.currentActorSub();
        String appId = resolveApplicationId(applicationId);

        ConversationSession session = sessionRepository
            .findByIdAndApplicationIdAndActorSub(conversationId, appId, actorSub)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Conversation not found"));

        if (session.getMode() != LlmMode.AGENT) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Conversation mode is not AGENT. Use ASK endpoint for question answering."
            );
        }

        String currentTenant = identityResolver.currentTenantId();
        if (session.getTenantId() != null && !session.getTenantId().equals(currentTenant)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Conversation tenant scope mismatch");
        }
        if (session.getTenantId() == null && currentTenant != null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Conversation scope mismatch");
        }
        return session;
    }

    private AgentRun createFailedRun(ConversationSession session, String prompt, String error) {
        AgentRun run = new AgentRun();
        run.setConversation(session);
        run.setApplicationId(session.getApplicationId());
        run.setTenantId(session.getTenantId());
        run.setActorSub(session.getActorSub());
        run.setScopeType(session.getScopeType());
        run.setStatus(AgentRunStatus.FAILED);
        run.setPrompt(prompt);
        run.setError(error);
        return runRepository.save(run);
    }

    private ConversationMessage persistConversationMessage(
        ConversationSession session,
        ConversationMessageRole role,
        String content,
        String requestId
    ) {
        ConversationMessage message = new ConversationMessage();
        message.setConversation(session);
        message.setRole(role);
        message.setContent(content);
        message.setRequestId(requestId);
        message.setCreatedAt(Instant.now());
        session.setUpdatedAt(Instant.now());
        sessionRepository.save(session);
        return messageRepository.save(message);
    }

    private LlmRequest toAgentLlmRequest(AgentProposeRequest request) {
        LlmRequest llmRequest = new LlmRequest();
        llmRequest.setPrompt(request.getContent().trim());
        llmRequest.setSystemInstruction(trimToNull(request.getSystemInstruction()));
        llmRequest.setResponseSchema(AGENT_RESPONSE_SCHEMA);
        llmRequest.setMetadata(request.getMetadata() != null ? request.getMetadata() : Map.of());
        llmRequest.setMode(LlmMode.AGENT);
        llmRequest.setTools(agentToolDescriptions.all());
        llmRequest.setToolChoice(LlmRequest.ToolChoice.AUTO);
        return llmRequest;
    }

    private AgentProposalPayload parseProposalPayload(LlmResponse llmResponse) {
        String content = llmResponse != null ? llmResponse.getContent() : null;
        if (trimToNull(content) != null) {
            try {
                AgentProposalPayload payload = objectMapper.readValue(content, AgentProposalPayload.class);
                if (payload.getActions() == null) {
                    payload.setActions(List.of());
                }
                return payload;
            } catch (Exception ex) {
                throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Agent planner returned invalid JSON response"
                );
            }
        }

        if (llmResponse != null && llmResponse.getToolCalls() != null && !llmResponse.getToolCalls().isEmpty()) {
            List<AgentProposalAction> actions = llmResponse.getToolCalls().stream()
                    .map(toolCall -> {
                        AgentProposalAction action = new AgentProposalAction();
                        action.setToolKey(toolCall.getName());
                        action.setTitle("Execute " + toolCall.getName());
                        action.setRequiresApproval(true);
                        if (toolCall.getArguments() != null && !toolCall.getArguments().isNull()) {
                            @SuppressWarnings("unchecked")
                            Map<String, Object> args = objectMapper.convertValue(toolCall.getArguments(), Map.class);
                            action.setArgs(args);
                        } else {
                            action.setArgs(Map.of());
                        }
                        return action;
                    })
                    .toList();
            AgentProposalPayload payload = new AgentProposalPayload();
            payload.setSummary("Tool-call proposal generated");
            payload.setActions(actions);
            return payload;
        }

        throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Agent planner returned empty response");
    }

    private void recordApproval(AgentAction action, AgentApprovalDecision decision, String comment) {
        AgentApproval approval = new AgentApproval();
        approval.setAction(action);
        approval.setDecision(decision);
        approval.setComment(trimToNull(comment));
        approval.setDecidedBy(identityResolver.currentActorSub());
        approvalRepository.save(approval);
    }

    private void refreshRunStatus(AgentRun run) {
        long pending = actionRepository.countByRun_IdAndStatus(run.getId(), AgentActionStatus.PENDING_APPROVAL);
        long failed = actionRepository.countByRun_IdAndStatus(run.getId(), AgentActionStatus.FAILED);
        long proposed = actionRepository.countByRun_IdAndStatus(run.getId(), AgentActionStatus.PROPOSED);
        long approved = actionRepository.countByRun_IdAndStatus(run.getId(), AgentActionStatus.APPROVED);
        long executed = actionRepository.countByRun_IdAndStatus(run.getId(), AgentActionStatus.EXECUTED);
        long rejected = actionRepository.countByRun_IdAndStatus(run.getId(), AgentActionStatus.REJECTED);

        if (failed > 0) {
            run.setStatus(AgentRunStatus.FAILED);
        } else if (pending > 0) {
            run.setStatus(AgentRunStatus.PENDING_APPROVAL);
        } else if (proposed > 0 || approved > 0) {
            run.setStatus(AgentRunStatus.PROPOSED);
        } else if (executed > 0 || rejected > 0) {
            run.setStatus(AgentRunStatus.COMPLETED);
        } else {
            run.setStatus(AgentRunStatus.PROPOSED);
        }
        runRepository.save(run);
    }

    private void logExecution(AgentAction action, AgentExecutionPhase phase, Map<String, Object> payload) {
        AgentExecutionLog log = new AgentExecutionLog();
        log.setAction(action);
        log.setPhase(phase);
        log.setPayloadJson(toJson(payload));
        executionLogRepository.save(log);
    }

    private Map<String, Object> parseArgs(String argsJson) {
        if (trimToNull(argsJson) == null) {
            return Map.of();
        }
        try {
            return objectMapper.readValue(argsJson, objectMapper.getTypeFactory().constructMapType(Map.class, String.class, Object.class));
        } catch (JsonProcessingException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid action args payload");
        }
    }

    private AgentRunResponse toRunResponse(AgentRun run) {
        return AgentRunResponse.builder()
            .id(run.getId())
            .status(run.getStatus())
            .model(run.getModel())
            .llmRequestId(run.getLlmRequestId())
            .llmCostUsd(run.getLlmCostUsd() != null ? run.getLlmCostUsd().doubleValue() : null)
            .error(run.getError())
            .createdAt(run.getCreatedAt())
            .updatedAt(run.getUpdatedAt())
            .build();
    }

    private AgentActionResponse toActionResponse(AgentAction action) {
        return AgentActionResponse.builder()
            .id(action.getId())
            .runId(action.getRun() != null ? action.getRun().getId() : null)
            .toolKey(action.getToolKey())
            .title(action.getTitle())
            .actionKey(action.getActionKey())
            .permissionKey(action.getPermissionKey())
            .entitlementKey(action.getEntitlementKey())
            .requiresApproval(Boolean.TRUE.equals(action.getRequiresApproval()))
            .status(action.getStatus())
            .argsJson(action.getArgsJson())
            .resultJson(action.getResultJson())
            .error(action.getError())
            .createdAt(action.getCreatedAt())
            .updatedAt(action.getUpdatedAt())
            .build();
    }

    private AgentMessageResponse toMessageResponse(ConversationMessage message) {
        return AgentMessageResponse.builder()
            .id(message.getId())
            .role(message.getRole())
            .content(message.getContent())
            .requestId(message.getRequestId())
            .createdAt(message.getCreatedAt())
            .build();
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

    private String rootMessage(Throwable throwable) {
        Throwable root = throwable;
        while (root.getCause() != null) {
            root = root.getCause();
        }
        return root.getMessage() != null ? root.getMessage() : "Unknown error";
    }
}



