package ma.nafura.platform.collaboration.comment.event;

import java.util.UUID;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class CommentCreatedEvent extends ApplicationEvent {

    private final UUID tenantId;
    private final UUID commentId;
    private final String entityType;
    private final UUID entityId;
    private final String authorEmail;
    private final UUID authorUserId;
    private final String body;

    public CommentCreatedEvent(
            Object source,
            UUID tenantId,
            UUID commentId,
            String entityType,
            UUID entityId,
            String authorEmail,
            UUID authorUserId,
            String body
    ) {
        super(source);
        this.tenantId = tenantId;
        this.commentId = commentId;
        this.entityType = entityType;
        this.entityId = entityId;
        this.authorEmail = authorEmail;
        this.authorUserId = authorUserId;
        this.body = body;
    }
}

