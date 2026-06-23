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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
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
        String author = UserContext.getUserEmail();
        if (author == null || author.isBlank()) {
            author = "system";
        }
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
        String author = UserContext.getUserEmail();
        if (author == null || author.isBlank()) {
            author = "system";
        }
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
    public void delete(UUID commentId) {
        RecordComment comment = commentRepository.findByIdAndTenantId(commentId, TenantContext.getTenantId())
                .orElseThrow(() -> new CrudNotFoundException("Comment not found: " + commentId));
        commentRepository.delete(comment);
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


