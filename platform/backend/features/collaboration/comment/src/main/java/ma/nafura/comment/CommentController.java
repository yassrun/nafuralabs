package ma.nafura.platform.collaboration.comment;

import ma.nafura.platform.collaboration.comment.domain.model.RecordComment;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/platform/collaboration/comments")
@SecuredResource(domain = "collaboration", feature = "collaboration", resource = "comment")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @GetMapping
    public ResponseEntity<Page<RecordComment>> list(
            @RequestParam String entityType,
            @RequestParam UUID entityId,
            Pageable pageable) {
        return ResponseEntity.ok(commentService.listByEntity(entityType, entityId, pageable));
    }

    @GetMapping("/{parentId}/replies")
    public ResponseEntity<List<RecordComment>> listReplies(@PathVariable UUID parentId) {
        return ResponseEntity.ok(commentService.listReplies(parentId));
    }

    @PostMapping
    public ResponseEntity<RecordComment> add(
            @Valid @RequestBody AddCommentRequest request) {
        RecordComment comment = commentService.add(
                request.getEntityType(),
                request.getEntityId(),
                request.getText());
        return ResponseEntity.status(HttpStatus.CREATED).body(comment);
    }

    @PostMapping("/reply")
    public ResponseEntity<RecordComment> addReply(
            @Valid @RequestBody AddReplyRequest request) {
        RecordComment comment = commentService.addReply(
                request.getEntityType(),
                request.getEntityId(),
                request.getParentCommentId(),
                request.getText());
        return ResponseEntity.status(HttpStatus.CREATED).body(comment);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        commentService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @lombok.Data
    public static class AddCommentRequest {
        @NotBlank private String entityType;
        @NotNull private UUID entityId;
        @NotBlank private String text;
    }

    @lombok.Data
    public static class AddReplyRequest {
        @NotBlank private String entityType;
        @NotNull private UUID entityId;
        @NotNull private UUID parentCommentId;
        @NotBlank private String text;
    }
}


