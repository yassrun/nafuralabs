package ma.nafura.platform.collaboration.docmanager.attachment;

import ma.nafura.platform.collaboration.docmanager.domain.model.RecordAttachment;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/platform/collaboration/attachments")
@SecuredResource(domain = "collaboration", feature = "collaboration", resource = "attachment")
@RequiredArgsConstructor
public class AttachmentController {

    private final AttachmentService attachmentService;
    private final FileStorageService fileStorage;

    @GetMapping
    public ResponseEntity<Page<RecordAttachment>> list(
            @RequestParam String entityType,
            @RequestParam String entityId,
            Pageable pageable) {
        return ResponseEntity.ok(attachmentService.listByEntity(entityType, entityId, pageable));
    }

    @PostMapping("/upload")
    public ResponseEntity<RecordAttachment> upload(
            @RequestParam String entityType,
            @RequestParam String entityId,
            @RequestParam("file") MultipartFile file) {
        RecordAttachment attachment = attachmentService.attach(entityType, entityId, file);
        return ResponseEntity.status(org.springframework.http.HttpStatus.CREATED).body(attachment);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        attachmentService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/download")
    public ResponseEntity<?> download(@RequestParam String key) {
        Optional<Resource> resourceOpt = fileStorage.getResource(key);
        if (resourceOpt.isPresent()) {
            Resource resource = resourceOpt.get();
            String filename = key.contains("/") ? key.substring(key.lastIndexOf('/') + 1) : "download";
            String safeFilename = filename.replaceAll("[^a-zA-Z0-9._-]", "_");
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + safeFilename + "\"")
                    .body(resource);
        }
        // S3: no direct resource; redirect to presigned URL
        String downloadUrl = fileStorage.getDownloadUrl(key);
        if (downloadUrl != null && downloadUrl.startsWith("http")) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FOUND)
                    .location(java.net.URI.create(downloadUrl))
                    .build();
        }
        return ResponseEntity.notFound().build();
    }
}


