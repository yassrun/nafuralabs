package ma.nafura.platform.collaboration.tagging;

import ma.nafura.platform.collaboration.tagging.domain.model.Tag;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/platform/collaboration/tags")
@SecuredResource(domain = "collaboration", feature = "collaboration", resource = "tag")
@RequiredArgsConstructor
public class TaggingController {

    private final TaggingService taggingService;

    @GetMapping
    public ResponseEntity<Page<Tag>> list(Pageable pageable) {
        return ResponseEntity.ok(taggingService.listTags(pageable));
    }

    @PostMapping
    public ResponseEntity<Tag> create(@RequestBody CreateTagRequest request) {
        Tag tag = taggingService.createTag(request.getName(), request.getColor(), request.getCategory());
        return ResponseEntity.status(HttpStatus.CREATED).body(tag);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        taggingService.deleteTag(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/entities/{entityType}/{entityId}")
    public ResponseEntity<Void> tagEntity(
            @PathVariable String entityType,
            @PathVariable UUID entityId,
            @RequestBody TagEntityRequest request) {
        taggingService.tagEntity(entityType, entityId, request.getTagId());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/entities/{entityType}/{entityId}/{tagId}")
    public ResponseEntity<Void> untagEntity(
            @PathVariable String entityType,
            @PathVariable UUID entityId,
            @PathVariable UUID tagId) {
        taggingService.untagEntity(entityType, entityId, tagId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/entities/{entityType}/{entityId}")
    public ResponseEntity<List<Tag>> listEntityTags(
            @PathVariable String entityType,
            @PathVariable UUID entityId) {
        return ResponseEntity.ok(taggingService.listTagsForEntity(entityType, entityId));
    }

    @lombok.Data
    public static class CreateTagRequest {
        @NotBlank private String name;
        private String color;
        private String category;
    }

    @lombok.Data
    public static class TagEntityRequest {
        private UUID tagId;
    }
}


