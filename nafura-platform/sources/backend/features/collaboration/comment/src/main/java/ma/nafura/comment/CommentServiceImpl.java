package ma.nafura.platform.collaboration.comment;

import ma.nafura.platform.collaboration.comment.domain.model.RecordComment;
import ma.nafura.platform.collaboration.comment.event.CommentCreatedEvent;
import ma.nafura.platform.collaboration.comment.repository.RecordCommentRepository;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.context.UserContext;
import ma.nafura.platform.framework.service.crud.CrudNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CommentServiceImpl implements CommentService {

    private final RecordCommentRepository commentRepository;
    private final ApplicationEventPublisher applicationEventPublisher;

    @Override
    @Transactional
    public RecordComment add(String entityType, UUID entityId, String text) {
        UUID tenantId = TenantContext.getTenantId();
        String author = currentAuthor();
        RecordComment comment = RecordComment.builder()
                .tenantId(tenantId)
                .entityType(entityType)
                .entityId(entityId)
                .author(author)
                .body(text != null ? text : "")
                .isInternal(false)
                .parentId(null)
                .build();
        RecordComment saved = commentRepository.save(comment);
        publishCommentEvent(saved, text);
        return saved;
    }

    @Override
    @Transactional
    public RecordComment addReply(String entityType, UUID entityId, UUID parentCommentId, String text) {
        RecordComment parent = commentRepository.findByIdAndTenantId(parentCommentId, TenantContext.getTenantId())
                .orElseThrow(() -> new CrudNotFoundException("Comment not found: " + parentCommentId));
        UUID tenantId = TenantContext.getTenantId();
        String author = currentAuthor();
        RecordComment reply = RecordComment.builder()
                .tenantId(tenantId)
                .entityType(entityType)
                .entityId(entityId)
                .author(author)
                .body(text != null ? text : "")
                .isInternal(parent.getIsInternal() != null && parent.getIsInternal())
                .parentId(parentCommentId)
                .build();
        RecordComment saved = commentRepository.save(reply);
        publishCommentEvent(saved, text);
        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<RecordComment> listByEntity(String entityType, UUID entityId, Pageable pageable) {
        UUID tenantId = TenantContext.getTenantId();
        return commentRepository.findByTenantIdAndEntityTypeAndEntityIdAndParentIdIsNullOrderByCreatedAtAsc(
                tenantId, entityType, entityId, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RecordComment> listReplies(UUID parentCommentId) {
        UUID tenantId = TenantContext.getTenantId();
        return commentRepository.findByTenantIdAndParentIdOrderByCreatedAtAsc(tenantId, parentCommentId);
    }

    @Override
    @Transactional
    public RecordComment update(UUID commentId, String text) {
        RecordComment comment = requireComment(commentId);
        assertAuthor(comment);
        if (!StringUtils.hasText(text)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Comment body is required");
        }
        comment.setBody(text.trim());
        comment.setEditedAt(OffsetDateTime.now());
        return commentRepository.save(comment);
    }

    @Override
    @Transactional
    public void delete(UUID commentId) {
        RecordComment comment = requireComment(commentId);
        assertAuthor(comment);
        commentRepository.delete(comment);
    }

    private RecordComment requireComment(UUID commentId) {
        return commentRepository.findByIdAndTenantId(commentId, TenantContext.getTenantId())
                .orElseThrow(() -> new CrudNotFoundException("Comment not found: " + commentId));
    }

    private void assertAuthor(RecordComment comment) {
        String me = currentAuthor();
        if (!sameAuthor(comment.getAuthor(), me)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Only the author can modify this comment");
        }
    }

    static boolean sameAuthor(String stored, String current) {
        if (stored == null || current == null) {
            return false;
        }
        return Objects.equals(
                stored.trim().toLowerCase(Locale.ROOT),
                current.trim().toLowerCase(Locale.ROOT));
    }

    private static String currentAuthor() {
        String author = UserContext.getUserEmail();
        if (author == null || author.isBlank()) {
            return "system";
        }
        return author.trim();
    }

    private void publishCommentEvent(RecordComment comment, String body) {
        applicationEventPublisher.publishEvent(
                new CommentCreatedEvent(
                        this,
                        comment.getTenantId(),
                        comment.getId(),
                        comment.getEntityType(),
                        comment.getEntityId(),
                        comment.getAuthor(),
                        UserContext.getUserIdOrNull(),
                        body
                )
        );
    }
}
