package ma.nafura.platform.ai.conversation.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import ma.nafura.platform.ai.conversation.domain.model.ConversationSession;
import ma.nafura.platform.ai.conversation.repository.ConversationSessionRepository;
import ma.nafura.platform.ai.conversation.service.ConversationTitleService;
import ma.nafura.platform.ai.llm.model.LlmCallContext;
import ma.nafura.platform.ai.llm.model.LlmResponse;
import ma.nafura.platform.ai.llm.service.LlmService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ConversationTitleServiceTest {

    @Mock
    private ConversationSessionRepository sessionRepository;

    @Mock
    private LlmService llmService;

    private ConversationTitleService service;

    @BeforeEach
    void setUp() {
        service = new ConversationTitleService(sessionRepository, llmService);
    }

    @Test
    void sanitizeTitle_stripsQuotesAndTruncates() {
        String longTitle = "A".repeat(300);
        assertEquals("Budget items actifs", ConversationTitleService.sanitizeTitle("\"Budget items actifs\""));
        assertEquals(255, ConversationTitleService.sanitizeTitle(longTitle).length());
    }

    @Test
    void maybeGenerateTitle_skipsWhenTitleAlreadySet() {
        ConversationSession session = new ConversationSession();
        session.setId(UUID.randomUUID());
        session.setTitle("Existing title");

        ConversationSession result = service.maybeGenerateTitle(session, "Hello", "World", LlmCallContext.builder().build());

        assertEquals("Existing title", result.getTitle());
        verify(llmService, never()).callLlm(any(), any());
        verify(sessionRepository, never()).save(any());
    }

    @Test
    void maybeGenerateTitle_persistsGeneratedTitle() {
        ConversationSession session = new ConversationSession();
        session.setId(UUID.randomUUID());

        when(llmService.callLlm(any(), any())).thenReturn(CompletableFuture.completedFuture(
            responseWithContent("Items actifs au Maroc")
        ));
        when(sessionRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        ConversationSession result = service.maybeGenerateTitle(
            session,
            "Combien d'items actifs ?",
            "Il y en a 1.",
            LlmCallContext.builder().idempotencyKey("conv:msg").build()
        );

        assertEquals("Items actifs au Maroc", result.getTitle());
        verify(sessionRepository).save(session);
    }

    @Test
    void maybeGenerateTitle_returnsSessionWhenLlmReturnsEmpty() {
        ConversationSession session = new ConversationSession();
        session.setId(UUID.randomUUID());

        when(llmService.callLlm(any(), any())).thenReturn(CompletableFuture.completedFuture(
            responseWithContent("   ")
        ));

        ConversationSession result = service.maybeGenerateTitle(session, "Hello", "Hi", LlmCallContext.builder().build());

        assertNull(result.getTitle());
        verify(sessionRepository, never()).save(any());
    }

    private static LlmResponse responseWithContent(String content) {
        LlmResponse response = new LlmResponse();
        response.setContent(content);
        return response;
    }
}
