package ma.nafura.platform.collaboration.comment;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.when;

import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.platform.collaboration.comment.domain.model.RecordComment;
import ma.nafura.platform.collaboration.comment.repository.RecordCommentRepository;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.context.UserContext;
import ma.nafura.platform.framework.service.crud.CrudNotFoundException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.server.ResponseStatusException;

/**
 * Baseline CH-00-INIT-commentaire. Photograph of current CommentServiceImpl.
 * VU-ROUGE pass: assertions inverted on first run, then restored.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class CommentBaselineTest {

    private static final UUID TENANT_A = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static final UUID TENANT_B = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private static final String ENTITY_TYPE = "record";
    private static final UUID ENTITY_ID = UUID.fromString("cccccccc-cccc-cccc-cccc-cccccccccccc");

    @Mock
    private RecordCommentRepository repository;

    @Mock
    private ApplicationEventPublisher events;

    private final Map<UUID, RecordComment> store = new LinkedHashMap<>();
    private CommentServiceImpl service;

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TENANT_A);
        UserContext.setUserEmail("alice@example.com");
        stubRepo();
        service = new CommentServiceImpl(repository, events);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
        UserContext.clear();
        store.clear();
    }

    @Test
    void posterEtLire() {
        RecordComment posted = service.add(ENTITY_TYPE, ENTITY_ID, "hello");
        Page<RecordComment> listed = service.listByEntity(
                ENTITY_TYPE, ENTITY_ID, PageRequest.of(0, 20));

        assertThat(listed.getContent()).extracting(RecordComment::getId).containsExactly(posted.getId());
        assertThat(posted.getBody()).isEqualTo("hello");
        assertThat(posted.getParentId()).isNull();
        assertThat(posted.getTenantId()).isEqualTo(TENANT_A);
        assertThat(posted.getEntityType()).isEqualTo(ENTITY_TYPE);
        assertThat(posted.getEntityId()).isEqualTo(ENTITY_ID);
        assertThat(posted.getAuthor()).isEqualTo("alice@example.com");
    }

    @Test
    void deuxTenants() {
        RecordComment ofA = service.add(ENTITY_TYPE, ENTITY_ID, "from-a");
        UUID unknown = UUID.fromString("dddddddd-dddd-dddd-dddd-dddddddddddd");

        TenantContext.setTenantId(TENANT_B);
        UserContext.setUserEmail("b@example.com");
        Page<RecordComment> listedB = service.listByEntity(
                ENTITY_TYPE, ENTITY_ID, PageRequest.of(0, 20));

        assertThat(listedB.getContent()).isEmpty();
        assertThatThrownBy(() -> service.update(ofA.getId(), "from-b"))
                .isInstanceOf(CrudNotFoundException.class);
        assertThatThrownBy(() -> service.update(unknown, "from-b"))
                .isInstanceOf(CrudNotFoundException.class);
        assertThatThrownBy(() -> service.delete(ofA.getId()))
                .isInstanceOf(CrudNotFoundException.class);
    }

    @Test
    void auteurSeul() {
        RecordComment ofAlice = service.add(ENTITY_TYPE, ENTITY_ID, "alice-msg");
        UserContext.setUserEmail("bob@example.com");

        assertThatThrownBy(() -> service.update(ofAlice.getId(), "hacked"))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode().value())
                        .isEqualTo(403));
        assertThatThrownBy(() -> service.delete(ofAlice.getId()))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode().value())
                        .isEqualTo(403));

        UserContext.setUserEmail("Alice@Example.com");
        RecordComment updated = service.update(ofAlice.getId(), "  edited  ");
        assertThat(updated.getBody()).isEqualTo("edited");
        assertThat(updated.getEditedAt()).isNotNull();
    }

    @Test
    void retirer() {
        RecordComment posted = service.add(ENTITY_TYPE, ENTITY_ID, "bye");
        service.delete(posted.getId());
        Page<RecordComment> listed = service.listByEntity(
                ENTITY_TYPE, ENTITY_ID, PageRequest.of(0, 20));

        assertThat(listed.getContent()).isEmpty();
        assertThatThrownBy(() -> service.update(posted.getId(), "gone"))
                .isInstanceOf(CrudNotFoundException.class);
    }

    @Test
    void repondre() {
        RecordComment root = service.add(ENTITY_TYPE, ENTITY_ID, "root");
        RecordComment reply = service.addReply(ENTITY_TYPE, ENTITY_ID, root.getId(), "reply");
        Page<RecordComment> roots = service.listByEntity(
                ENTITY_TYPE, ENTITY_ID, PageRequest.of(0, 20));
        var replies = service.listReplies(root.getId());

        assertThat(reply.getParentId()).isEqualTo(root.getId());
        assertThat(roots.getContent()).extracting(RecordComment::getId).containsExactly(root.getId());
        assertThat(replies).extracting(RecordComment::getId).containsExactly(reply.getId());
        assertThat(replies.get(0).getBody()).isEqualTo("reply");
        assertThat(replies.get(0).getTenantId()).isEqualTo(TENANT_A);
    }

    private void stubRepo() {
        when(repository.save(any(RecordComment.class))).thenAnswer(inv -> {
            RecordComment c = inv.getArgument(0);
            if (c.getId() == null) {
                c.setId(UUID.randomUUID());
            }
            if (c.getCreatedAt() == null) {
                c.setCreatedAt(OffsetDateTime.now());
            }
            if (c.getUpdatedAt() == null) {
                c.setUpdatedAt(OffsetDateTime.now());
            }
            store.put(c.getId(), c);
            return c;
        });
        when(repository.findByIdAndTenantId(any(), any())).thenAnswer(inv -> {
            RecordComment c = store.get(inv.getArgument(0));
            UUID tenant = inv.getArgument(1);
            if (c == null || !tenant.equals(c.getTenantId())) {
                return Optional.empty();
            }
            return Optional.of(c);
        });
        when(repository.findByTenantIdAndEntityTypeAndEntityIdAndParentIdIsNullOrderByCreatedAtAsc(
                any(), any(), any(), any())).thenAnswer(inv -> {
            UUID tenant = inv.getArgument(0);
            String type = inv.getArgument(1);
            UUID id = inv.getArgument(2);
            var pageable = inv.getArgument(3, org.springframework.data.domain.Pageable.class);
            var items = store.values().stream()
                    .filter(c -> tenant.equals(c.getTenantId())
                            && type.equals(c.getEntityType())
                            && id.equals(c.getEntityId())
                            && c.getParentId() == null)
                    .sorted(Comparator.comparing(RecordComment::getCreatedAt))
                    .toList();
            return new PageImpl<>(items, pageable, items.size());
        });
        when(repository.findByTenantIdAndParentIdOrderByCreatedAtAsc(any(), any())).thenAnswer(inv -> {
            UUID tenant = inv.getArgument(0);
            UUID parentId = inv.getArgument(1);
            return store.values().stream()
                    .filter(c -> tenant.equals(c.getTenantId()) && parentId.equals(c.getParentId()))
                    .sorted(Comparator.comparing(RecordComment::getCreatedAt))
                    .toList();
        });
        doAnswer(inv -> {
            RecordComment c = inv.getArgument(0);
            store.remove(c.getId());
            return null;
        }).when(repository).delete(any(RecordComment.class));
    }
}
