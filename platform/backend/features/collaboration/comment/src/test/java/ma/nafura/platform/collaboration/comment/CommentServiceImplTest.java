package ma.nafura.platform.collaboration.comment;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;
import ma.nafura.platform.collaboration.comment.domain.model.RecordComment;
import ma.nafura.platform.collaboration.comment.repository.RecordCommentRepository;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.context.UserContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class CommentServiceImplTest {

    private static final UUID TENANT = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static final UUID COMMENT_ID = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private static final UUID ENTITY_ID = UUID.fromString("cccccccc-cccc-cccc-cccc-cccccccccccc");

    @Mock
    private RecordCommentRepository repository;

    @Mock
    private ApplicationEventPublisher events;

    private CommentServiceImpl service;

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TENANT);
        UserContext.setUserEmail("alice@example.com");
        service = new CommentServiceImpl(repository, events);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
        UserContext.clear();
    }

    @Test
    void sameAuthor_isCaseInsensitive() {
        assertThat(CommentServiceImpl.sameAuthor("Alice@Example.com", "alice@example.com")).isTrue();
        assertThat(CommentServiceImpl.sameAuthor("alice@example.com", "bob@example.com")).isFalse();
    }

    @Test
    void update_byAuthor_setsBodyAndEditedAt() {
        RecordComment existing = RecordComment.builder()
                .id(COMMENT_ID)
                .tenantId(TENANT)
                .entityType("dpgf_noeud")
                .entityId(ENTITY_ID)
                .author("alice@example.com")
                .body("old")
                .build();
        when(repository.findByIdAndTenantId(COMMENT_ID, TENANT)).thenReturn(Optional.of(existing));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        RecordComment updated = service.update(COMMENT_ID, "  new text  ");

        assertThat(updated.getBody()).isEqualTo("new text");
        assertThat(updated.getEditedAt()).isNotNull();
    }

    @Test
    void update_byOtherUser_forbidden() {
        RecordComment existing = RecordComment.builder()
                .id(COMMENT_ID)
                .tenantId(TENANT)
                .entityType("dpgf_noeud")
                .entityId(ENTITY_ID)
                .author("bob@example.com")
                .body("old")
                .build();
        when(repository.findByIdAndTenantId(COMMENT_ID, TENANT)).thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> service.update(COMMENT_ID, "hack"))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode().value())
                        .isEqualTo(403));
    }

    @Test
    void delete_byAuthor_removes() {
        RecordComment existing = RecordComment.builder()
                .id(COMMENT_ID)
                .tenantId(TENANT)
                .entityType("dpgf_noeud")
                .entityId(ENTITY_ID)
                .author("alice@example.com")
                .body("bye")
                .build();
        when(repository.findByIdAndTenantId(COMMENT_ID, TENANT)).thenReturn(Optional.of(existing));

        service.delete(COMMENT_ID);

        ArgumentCaptor<RecordComment> captor = ArgumentCaptor.forClass(RecordComment.class);
        verify(repository).delete(captor.capture());
        assertThat(captor.getValue().getId()).isEqualTo(COMMENT_ID);
    }

    @Test
    void delete_byOtherUser_forbidden() {
        RecordComment existing = RecordComment.builder()
                .id(COMMENT_ID)
                .tenantId(TENANT)
                .entityType("dpgf_noeud")
                .entityId(ENTITY_ID)
                .author("bob@example.com")
                .body("bye")
                .build();
        when(repository.findByIdAndTenantId(COMMENT_ID, TENANT)).thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> service.delete(COMMENT_ID))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode().value())
                        .isEqualTo(403));
    }
}
