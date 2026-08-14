package ma.nafura.platform.ai.agent.api.controller;

import jakarta.validation.Valid;
import java.util.UUID;
import java.util.concurrent.CompletionException;
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
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/ai/conversations")
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "nafura.ai.assistant", name = "unified", havingValue = "true", matchIfMissing = true)
public class AssistantController {

    private final AssistantOrchestrator assistantOrchestrator;

    /**
     * Blocks on the LLM future instead of returning {@code CompletableFuture}.
     * Returning an async type drops the SecurityContext on completion (WebClient thread)
     * and the response is rejected with HTTP 401 even after a successful turn.
     */
    @PostMapping("/{conversationId}/turn")
    public ResponseEntity<AssistantTurnResponse> turn(
            @PathVariable UUID conversationId,
            @RequestParam(required = false) String applicationId,
            @Valid @RequestBody AssistantTurnRequest request
    ) {
        try {
            return ResponseEntity.ok(
                    assistantOrchestrator.processTurn(conversationId, applicationId, request).join()
            );
        } catch (CompletionException ex) {
            Throwable cause = ex.getCause() != null ? ex.getCause() : ex;
            if (cause instanceof ResponseStatusException rse) {
                throw rse;
            }
            if (cause instanceof RuntimeException re) {
                throw re;
            }
            throw new RuntimeException(cause);
        }
    }
}
