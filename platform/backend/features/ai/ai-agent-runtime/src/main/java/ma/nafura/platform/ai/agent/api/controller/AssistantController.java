package ma.nafura.platform.ai.agent.api.controller;

import jakarta.validation.Valid;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import lombok.RequiredArgsConstructor;
import ma.nafura.platform.ai.agent.api.request.AssistantTurnRequest;
import ma.nafura.platform.ai.agent.api.response.AssistantTurnResponse;
import ma.nafura.platform.ai.agent.service.AssistantOrchestrator;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai/conversations")
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "nafura.ai.assistant", name = "unified", havingValue = "true", matchIfMissing = true)
public class AssistantController {

    private final AssistantOrchestrator assistantOrchestrator;

    @PostMapping("/{conversationId}/turn")
    public CompletableFuture<ResponseEntity<AssistantTurnResponse>> turn(
            @PathVariable UUID conversationId,
            @RequestParam(required = false) String applicationId,
            @Valid @RequestBody AssistantTurnRequest request
    ) {
        return assistantOrchestrator.processTurn(conversationId, applicationId, request)
                .thenApply(ResponseEntity::ok);
    }
}
