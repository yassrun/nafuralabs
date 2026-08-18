package ma.nafura.platform.ai.conversation;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.platform.ai.conversation.api.request.CreateConversationRequest;
import ma.nafura.platform.ai.conversation.api.response.ConversationMessageResponse;
import ma.nafura.platform.ai.conversation.api.response.ConversationSessionResponse;
import ma.nafura.platform.ai.conversation.domain.model.ConversationMessage;
import ma.nafura.platform.ai.conversation.domain.model.ConversationSession;
import ma.nafura.platform.ai.conversation.repository.ConversationMessageRepository;
import ma.nafura.platform.ai.conversation.repository.ConversationSessionRepository;
import ma.nafura.platform.ai.conversation.service.ConversationIdentityResolver;
import ma.nafura.platform.ai.conversation.service.ConversationService;
import ma.nafura.platform.ai.conversation.service.ConversationTitleService;
import ma.nafura.platform.ai.llm.model.ScopeType;
import ma.nafura.platform.ai.llm.service.LlmService;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.context.UserContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ConversationBaselineTest {

    private static final UUID TENANT_A = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static final UUID TENANT_B = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private static final UUID PERSONNE = UUID.fromString("dddddddd-dddd-dddd-dddd-dddddddddddd");
    private static final String APP = "nafura-app";

    @Mock
    private ConversationSessionRepository sessionRepository;

    @Mock
    private ConversationMessageRepository messageRepository;

    @Mock
    private LlmService llmService;

    @Mock
    private ConversationTitleService conversationTitleService;

    private final Map<UUID, ConversationSession> sessions = new LinkedHashMap<>();
    private final List<ConversationMessage> messages = new ArrayList<>();
    private ConversationService conversations;

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TENANT_A);
        UserContext.setUserId(PERSONNE);
        UserContext.setUserEmail("a@example.com");
        stubRepos();
        conversations = new ConversationService(
                sessionRepository,
                messageRepository,
                new ConversationIdentityResolver(),
                llmService,
                new ObjectMapper(),
                conversationTitleService,
                null,
                null,
                null,
                null);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
        UserContext.clear();
        sessions.clear();
        messages.clear();
    }

    @Test
    void creerEtLister() {
        ConversationSessionResponse created = conversations.createConversation(request("chez A"));
        Page<ConversationSessionResponse> listed = conversations.listConversations(APP, 0, 20);

        assertThat(listed.getContent())
                .extracting(ConversationSessionResponse::getId)
                .contains(created.getId());
        assertThat(sessions.get(created.getId()).getTenantId()).isEqualTo(TENANT_A.toString());
    }

    @Test
    void deuxTenants() {
        ConversationSessionResponse ofA = conversations.createConversation(request("chez A"));

        TenantContext.setTenantId(TENANT_B);
        Page<ConversationSessionResponse> listedB = conversations.listConversations(APP, 0, 20);

        assertThat(listedB.getContent()).isEmpty();
        assertThatThrownBy(() -> conversations.listMessages(ofA.getId(), APP))
                .isInstanceOf(ResponseStatusException.class);
    }

    @Test
    void sessionIntrouvable() {
        UUID unknown = UUID.fromString("99999999-9999-9999-9999-999999999999");
        assertThatThrownBy(() -> conversations.listMessages(unknown, APP))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                        .isEqualTo(HttpStatus.NOT_FOUND));
    }

    @Test
    void messagesVides() {
        ConversationSessionResponse created = conversations.createConversation(request("nouvelle"));
        List<ConversationMessageResponse> listed = conversations.listMessages(created.getId(), APP);

        assertThat(listed).isEmpty();
    }

    private static CreateConversationRequest request(String title) {
        CreateConversationRequest req = new CreateConversationRequest();
        req.setApplicationId(APP);
        req.setTitle(title);
        return req;
    }

    private void stubRepos() {
        when(sessionRepository.save(any(ConversationSession.class))).thenAnswer(inv -> {
            ConversationSession s = inv.getArgument(0);
            if (s.getId() == null) {
                s.setId(UUID.randomUUID());
            }
            sessions.put(s.getId(), s);
            return s;
        });
        when(sessionRepository.findByApplicationIdAndActorSubAndScopeTypeAndTenantIdOrderByUpdatedAtDesc(
                        any(), any(), any(), any(), any()))
                .thenAnswer(inv -> {
                    String appId = inv.getArgument(0);
                    String actorSub = inv.getArgument(1);
                    ScopeType scope = inv.getArgument(2);
                    String tenantId = inv.getArgument(3);
                    Pageable pageable = inv.getArgument(4, Pageable.class);
                    var items = sessions.values().stream()
                            .filter(s -> appId.equals(s.getApplicationId())
                                    && actorSub.equals(s.getActorSub())
                                    && scope.equals(s.getScopeType())
                                    && tenantId.equals(s.getTenantId()))
                            .sorted(Comparator.comparing(ConversationSession::getUpdatedAt).reversed())
                            .toList();
                    return new PageImpl<>(items, pageable, items.size());
                });
        when(sessionRepository.findByIdAndApplicationIdAndActorSub(any(), any(), any()))
                .thenAnswer(inv -> {
                    ConversationSession s = sessions.get(inv.getArgument(0));
                    if (s == null) {
                        return Optional.empty();
                    }
                    String appId = inv.getArgument(1);
                    String actorSub = inv.getArgument(2);
                    if (!appId.equals(s.getApplicationId()) || !actorSub.equals(s.getActorSub())) {
                        return Optional.empty();
                    }
                    return Optional.of(s);
                });
        when(messageRepository.findByConversationOrderByCreatedAtAsc(any()))
                .thenAnswer(inv -> {
                    ConversationSession session = inv.getArgument(0);
                    return messages.stream()
                            .filter(m -> m.getConversation() != null
                                    && session.getId().equals(m.getConversation().getId()))
                            .toList();
                });
    }
}
