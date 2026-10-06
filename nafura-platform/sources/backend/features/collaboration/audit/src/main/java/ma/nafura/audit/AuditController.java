package ma.nafura.platform.collaboration.audit;

import ma.nafura.platform.collaboration.audit.domain.model.AuditEvent;
import ma.nafura.platform.authorization.security.authorization.HostRecordGate;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import ma.nafura.platform.framework.record.RecordAccess;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/platform/collaboration/audit")
@SecuredResource(domain = "collaboration", feature = "collaboration", resource = "audit")
@RequiredArgsConstructor
public class AuditController {

    private final AuditService auditService;
    private final RecordAccess recordAccess;

    /**
     * Entity-scoped timeline. When {@code entityType} is a host record, read access
     * follows that record (same as comments/attachments), not {@code collaboration.collaboration.audit.read}.
     */
    @HostRecordGate
    @GetMapping("/timeline")
    public ResponseEntity<Page<AuditEvent>> getTimeline(
            @RequestParam String entityType,
            @RequestParam String entityId,
            Pageable pageable) {
        String type = one(entityType);
        String id = one(entityId);
        gate(type, id);
        Page<AuditEvent> page = auditService.getTimeline(type, id, pageable);
        return ResponseEntity.ok(page);
    }

    @GetMapping("/log/entity-types")
    @RequirePermission(value = "administration.audit.read", fullPermission = true)
    public ResponseEntity<List<String>> getDistinctEntityTypes() {
        return ResponseEntity.ok(auditService.getDistinctEntityTypes());
    }

    @GetMapping("/log")
    @RequirePermission(value = "administration.audit.read", fullPermission = true)
    public ResponseEntity<Page<AuditEvent>> getLog(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String actor,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime to,
            Pageable pageable) {
        AuditLogQuery query = AuditLogQuery.builder()
                .search(trimToNull(search))
                .entityType(trimToNull(entityType))
                .action(trimToNull(action))
                .actor(trimToNull(actor))
                .from(from)
                .to(to)
                .build();
        Page<AuditEvent> page = auditService.getLog(query, pageable);
        return ResponseEntity.ok(page);
    }

    private void gate(String entityType, String entityId) {
        if (recordAccess.known(entityType)) {
            recordAccess.require(entityType, entityId, false);
        }
    }

    private static String one(String value) {
        if (value == null) return null;
        int comma = value.indexOf(',');
        String first = (comma < 0 ? value : value.substring(0, comma)).trim();
        return first.isEmpty() ? null : first;
    }

    private static String trimToNull(String s) {
        if (s == null || s.isBlank()) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    @PostMapping("/log")
    public ResponseEntity<AuditEvent> log(
            @Valid @RequestBody LogAuditRequest request) {
        AuditEvent event = auditService.log(
                request.getEntityType(),
                request.getEntityId(),
                request.getAction(),
                request.getDetails(),
                request.getPayload());
        return ResponseEntity.status(HttpStatus.CREATED).body(event);
    }

    @lombok.Data
    public static class LogAuditRequest {
        @NotBlank private String entityType;
        @NotBlank private String entityId;
        @NotBlank private String action;
        private String details;
        private Map<String, Object> payload;
    }
}


