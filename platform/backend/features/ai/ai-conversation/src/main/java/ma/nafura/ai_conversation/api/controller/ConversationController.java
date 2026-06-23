package ma.nafura.platform.ai.conversation.api.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.nafura.platform.ai.conversation.api.request.CreateConversationRequest;
import ma.nafura.platform.ai.conversation.api.request.SendMessageRequest;
import ma.nafura.platform.ai.conversation.api.response.ConversationMessageResponse;
import ma.nafura.platform.ai.conversation.api.response.ConversationSessionResponse;
import ma.nafura.platform.ai.conversation.api.response.SendMessageResponse;
import ma.nafura.platform.ai.conversation.service.ConversationService;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.domain.Page;
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
import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/api/ai/conversations")
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "nafura.ai.conversation", name = "enabled", havingValue = "true", matchIfMissing = true)
public class ConversationController {
    private final ConversationService conversationService;

    @PostMapping
    public ResponseEntity<ConversationSessionResponse> createConversation(
        @RequestBody(required = false) CreateConversationRequest request
    ) {
        return ResponseEntity.ok(conversationService.createConversation(request));
    }

    @GetMapping
    public ResponseEntity<Page<ConversationSessionResponse>> listConversations(
        @RequestParam(required = false) String applicationId,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(conversationService.listConversations(applicationId, page, size));
    }

    @GetMapping("/{conversationId}/messages")
    public ResponseEntity<List<ConversationMessageResponse>> listMessages(
        @PathVariable UUID conversationId,
        @RequestParam(required = false) String applicationId
    ) {
        return ResponseEntity.ok(conversationService.listMessages(conversationId, applicationId));
    }

    @PostMapping("/{conversationId}/messages")
    public CompletableFuture<ResponseEntity<SendMessageResponse>> sendMessage(
        @PathVariable UUID conversationId,
        @RequestParam(required = false) String applicationId,
        @Valid @RequestBody SendMessageRequest request
    ) {
        return conversationService.sendAskMessage(conversationId, applicationId, request)
            .thenApply(ResponseEntity::ok);
    }
}

