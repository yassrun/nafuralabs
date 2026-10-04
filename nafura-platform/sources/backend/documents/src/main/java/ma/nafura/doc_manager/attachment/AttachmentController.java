package ma.nafura.platform.collaboration.docmanager.attachment;

import ma.nafura.platform.collaboration.docmanager.domain.model.RecordAttachment;
import ma.nafura.platform.authorization.security.authorization.HostRecordGate;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.record.RecordAccess;
import ma.nafura.platform.framework.service.crud.CrudNotFoundException;
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
    private final RecordAccess recordAccess;

    @HostRecordGate
    @GetMapping
    public ResponseEntity<Page<RecordAttachment>> list(
            @RequestParam String entityType,
            @RequestParam String entityId,
            Pageable pageable) {
        String type = one(entityType);
        String id = one(entityId);
        gate(type, id, false);
        return ResponseEntity.ok(attachmentService.listByEntity(type, id, pageable));
    }

    @HostRecordGate
    @PostMapping("/upload")
    public ResponseEntity<RecordAttachment> upload(
            @RequestParam String entityType,
            @RequestParam String entityId,
            @RequestParam("file") MultipartFile file) {
        String type = one(entityType);
        String id = one(entityId);
        gate(type, id, true);
        RecordAttachment attachment = attachmentService.attach(type, id, file);
        return ResponseEntity.status(org.springframework.http.HttpStatus.CREATED).body(attachment);
    }

    @HostRecordGate
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID id,
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) String entityId) {
        RecordAttachment attachment = attachmentService.find(id)
                .orElseThrow(() -> new CrudNotFoundException("Attachment not found: " + id));
        gate(one(first(entityType, attachment.getEntityType())), one(first(entityId, attachment.getEntityId())), true);
        attachmentService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @HostRecordGate
    @GetMapping("/download")
    public ResponseEntity<?> download(
            @RequestParam String key,
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) String entityId) {
        String type = one(entityType);
        if (type != null) {
            gate(type, one(entityId), false);
        }
        if (!StorageKey.belongsToTenant(key, TenantContext.getTenantId())) {
            return ResponseEntity.notFound().build();
        }
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

    private void gate(String entityType, String entityId, boolean write) {
        if (recordAccess.known(entityType)) {
            recordAccess.require(entityType, entityId, write);
        }
    }

    private static String first(String requested, String stored) {
        return requested == null || requested.isBlank() ? stored : requested;
    }

    /** Query and multipart repeat the same field; Spring joins them. The gate uses the first value. */
    private static String one(String value) {
        if (value == null) return null;
        int comma = value.indexOf(',');
        String first = (comma < 0 ? value : value.substring(0, comma)).trim();
        return first.isEmpty() ? null : first;
    }
}


