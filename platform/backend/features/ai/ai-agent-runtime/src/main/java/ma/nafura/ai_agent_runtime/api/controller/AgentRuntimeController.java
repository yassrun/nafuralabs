package ma.nafura.platform.ai.agent.api.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.nafura.platform.ai.agent.api.request.AgentDecisionRequest;
import ma.nafura.platform.ai.agent.api.request.AgentProposeRequest;
import ma.nafura.platform.ai.agent.api.response.AgentActionResponse;
import ma.nafura.platform.ai.agent.api.response.AgentProposeResponse;
import ma.nafura.platform.ai.agent.service.AgentRuntimeService;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/ai/conversations/{conversationId}/agent")
@ConditionalOnProperty(prefix = "nafura.ai.agent-runtime", name = "enabled", havingValue = "true", matchIfMissing = true)
public class AgentRuntimeController {
    private final AgentRuntimeService agentRuntimeService;

    @PostMapping("/propose")
    public ResponseEntity<AgentProposeResponse> propose(
        @PathVariable UUID conversationId,
        @RequestParam(required = false) String applicationId,
        @Valid @RequestBody AgentProposeRequest request
    ) {
        return ResponseEntity.ok(agentRuntimeService.proposeActions(conversationId, applicationId, request));
    }

    @GetMapping("/actions")
    public ResponseEntity<List<AgentActionResponse>> listActions(
        @PathVariable UUID conversationId,
        @RequestParam(required = false) String applicationId
    ) {
        return ResponseEntity.ok(agentRuntimeService.listConversationActions(conversationId, applicationId));
    }

    @PostMapping("/actions/{actionId}/approve")
    public ResponseEntity<AgentActionResponse> approve(
        @PathVariable UUID conversationId,
        @PathVariable UUID actionId,
        @RequestParam(required = false) String applicationId,
        @RequestBody(required = false) AgentDecisionRequest request
    ) {
        return ResponseEntity.ok(agentRuntimeService.approveAction(conversationId, actionId, applicationId, request));
    }

    @PostMapping("/actions/{actionId}/reject")
    public ResponseEntity<AgentActionResponse> reject(
        @PathVariable UUID conversationId,
        @PathVariable UUID actionId,
        @RequestParam(required = false) String applicationId,
        @RequestBody(required = false) AgentDecisionRequest request
    ) {
        return ResponseEntity.ok(agentRuntimeService.rejectAction(conversationId, actionId, applicationId, request));
    }

    @PostMapping("/actions/{actionId}/execute")
    public ResponseEntity<AgentActionResponse> execute(
        @PathVariable UUID conversationId,
        @PathVariable UUID actionId,
        @RequestParam(required = false) String applicationId
    ) {
        return ResponseEntity.ok(agentRuntimeService.executeAction(conversationId, actionId, applicationId));
    }
}

