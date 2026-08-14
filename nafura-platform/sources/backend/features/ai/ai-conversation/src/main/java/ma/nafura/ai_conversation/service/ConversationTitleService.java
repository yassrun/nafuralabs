package ma.nafura.platform.ai.conversation.service;

import java.time.Instant;
import lombok.RequiredArgsConstructor;
import ma.nafura.platform.ai.conversation.domain.model.ConversationSession;
import ma.nafura.platform.ai.conversation.repository.ConversationSessionRepository;
import ma.nafura.platform.ai.llm.model.LlmCallContext;
import ma.nafura.platform.ai.llm.model.LlmMode;
import ma.nafura.platform.ai.llm.model.LlmRequest;
import ma.nafura.platform.ai.llm.model.LlmResponse;
import ma.nafura.platform.ai.llm.service.LlmService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "nafura.ai.conversation", name = "enabled", havingValue = "true", matchIfMissing = true)
public class ConversationTitleService {

    private static final Logger log = LoggerFactory.getLogger(ConversationTitleService.class);
    private static final int MAX_TITLE_LENGTH = 255;
    private static final int ASSISTANT_PREVIEW_LENGTH = 300;

    private static final String TITLE_SYSTEM_INSTRUCTION = """
        Generate a concise conversation title (max 8 words, no quotes).
        Reply with only the title text.
        Use French if the user message is in French, otherwise match the user language.
        """;

    private final ConversationSessionRepository sessionRepository;
    private final LlmService llmService;

    @Transactional
    public ConversationSession maybeGenerateTitle(
        ConversationSession session,
        String userContent,
        String assistantContent,
        LlmCallContext baseContext
    ) {
        if (trimToNull(session.getTitle()) != null) {
            return session;
        }
        if (trimToNull(userContent) == null) {
            return session;
        }

        try {
            String title = generateTitle(userContent, assistantContent, baseContext);
            if (title != null) {
                session.setTitle(title);
                session.setUpdatedAt(Instant.now());
                return sessionRepository.save(session);
            }
        } catch (Exception ex) {
            log.warn("Failed to generate conversation title for session {}: {}", session.getId(), ex.getMessage());
        }
        return session;
    }

    private String generateTitle(String userContent, String assistantContent, LlmCallContext baseContext) {
        String prompt = "User message:\n" + userContent.trim();
        String assistantPreview = trimToNull(assistantContent);
        if (assistantPreview != null) {
            prompt += "\n\nAssistant reply (preview):\n" + truncate(assistantPreview, ASSISTANT_PREVIEW_LENGTH);
        }

        LlmRequest request = new LlmRequest();
        request.setMode(LlmMode.ASK);
        request.setSystemInstruction(TITLE_SYSTEM_INSTRUCTION);
        request.setPrompt(prompt);

        String idempotencyKey = baseContext != null && baseContext.getIdempotencyKey() != null
            ? baseContext.getIdempotencyKey() + ":title"
            : null;

        LlmCallContext context = LlmCallContext.builder()
            .applicationId(baseContext != null ? baseContext.getApplicationId() : null)
            .domainKey(baseContext != null ? baseContext.getDomainKey() : null)
            .featureKey("conversation-title")
            .mode(LlmMode.ASK)
            .conversationId(baseContext != null ? baseContext.getConversationId() : null)
            .messageId(baseContext != null ? baseContext.getMessageId() : null)
            .actorSub(baseContext != null ? baseContext.getActorSub() : null)
            .tenantId(baseContext != null ? baseContext.getTenantId() : null)
            .scopeType(baseContext != null ? baseContext.getScopeType() : null)
            .idempotencyKey(idempotencyKey)
            .build();

        LlmResponse response = llmService.callLlm(request, context).join();
        String raw = response != null ? trimToNull(response.getContent()) : null;
        if (raw == null) {
            return null;
        }
        return sanitizeTitle(raw);
    }

    static String sanitizeTitle(String raw) {
        String title = raw.trim();
        if (title.startsWith("\"") && title.endsWith("\"") && title.length() > 1) {
            title = title.substring(1, title.length() - 1).trim();
        }
        if (title.length() > MAX_TITLE_LENGTH) {
            title = title.substring(0, MAX_TITLE_LENGTH).trim();
        }
        return title.isEmpty() ? null : title;
    }

    private static String truncate(String value, int maxLength) {
        if (value.length() <= maxLength) {
            return value;
        }
        return value.substring(0, maxLength).trim() + "...";
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
