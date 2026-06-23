package ma.nafura.platform.collaboration.comment;

import ma.nafura.platform.collaboration.comment.domain.model.RecordComment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface CommentService {

    RecordComment add(String entityType, UUID entityId, String text);

    RecordComment addReply(String entityType, UUID entityId, UUID parentCommentId, String text);

    Page<RecordComment> listByEntity(String entityType, UUID entityId, Pageable pageable);

    List<RecordComment> listReplies(UUID parentCommentId);

    void delete(UUID commentId);
}

