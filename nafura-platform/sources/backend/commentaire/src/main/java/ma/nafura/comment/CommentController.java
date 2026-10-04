package ma.nafura.platform.collaboration.comment;

import ma.nafura.platform.collaboration.comment.domain.model.RecordComment;
import ma.nafura.platform.authorization.security.authorization.HostRecordGate;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import ma.nafura.platform.framework.record.RecordAccess;
import ma.nafura.platform.framework.service.crud.CrudNotFoundException;
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
    private final RecordAccess recordAccess;

    @HostRecordGate
    @GetMapping
    public ResponseEntity<Page<RecordComment>> list(
            @RequestParam String entityType,
            @RequestParam UUID entityId,
            Pageable pageable) {
        gate(entityType, entityId, false);
        return ResponseEntity.ok(commentService.listByEntity(entityType, entityId, pageable));
    }

    @HostRecordGate
    @GetMapping("/{parentId}/replies")
    public ResponseEntity<List<RecordComment>> listReplies(
            @PathVariable UUID parentId,
            @RequestParam(required = false) String entityType) {
        RecordComment parent = commentService.find(parentId)
                .orElseThrow(() -> new CrudNotFoundException("Comment not found: " + parentId));
        gate(entityType == null || entityType.isBlank() ? parent.getEntityType() : entityType, parent.getEntityId(), false);
        return ResponseEntity.ok(commentService.listReplies(parentId));
    }

    @HostRecordGate
    @PostMapping
    public ResponseEntity<RecordComment> add(
            @Valid @RequestBody AddCommentRequest request) {
        gate(request.getEntityType(), request.getEntityId(), true);
        RecordComment comment = commentService.add(
                request.getEntityType(),
                request.getEntityId(),
                request.getText());
        return ResponseEntity.status(HttpStatus.CREATED).body(comment);
    }

    @HostRecordGate
    @PostMapping("/reply")
    public ResponseEntity<RecordComment> addReply(
            @Valid @RequestBody AddReplyRequest request) {
        gate(request.getEntityType(), request.getEntityId(), true);
        RecordComment comment = commentService.addReply(
                request.getEntityType(),
                request.getEntityId(),
                request.getParentCommentId(),
                request.getText());
        return ResponseEntity.status(HttpStatus.CREATED).body(comment);
    }

    @HostRecordGate
    @PatchMapping("/{id}")
    public ResponseEntity<RecordComment> update(
            @PathVariable UUID id,
            @RequestParam(required = false) String entityType,
            @Valid @RequestBody UpdateCommentRequest request) {
        RecordComment existing = commentService.find(id)
                .orElseThrow(() -> new CrudNotFoundException("Comment not found: " + id));
        gate(entityType == null || entityType.isBlank() ? existing.getEntityType() : entityType, existing.getEntityId(), true);
        return ResponseEntity.ok(commentService.update(id, request.getText()));
    }

    @HostRecordGate
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID id,
            @RequestParam(required = false) String entityType) {
        RecordComment existing = commentService.find(id)
                .orElseThrow(() -> new CrudNotFoundException("Comment not found: " + id));
        gate(entityType == null || entityType.isBlank() ? existing.getEntityType() : entityType, existing.getEntityId(), true);
        commentService.delete(id);
        return ResponseEntity.noContent().build();
    }

    private void gate(String entityType, UUID entityId, boolean write) {
        if (recordAccess.known(entityType)) {
            recordAccess.require(entityType, entityId, write);
        }
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

    @lombok.Data
    public static class UpdateCommentRequest {
        @NotBlank private String text;
    }
}


