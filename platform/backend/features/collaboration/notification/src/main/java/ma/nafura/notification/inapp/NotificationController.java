package ma.nafura.platform.collaboration.notification.inapp;

import ma.nafura.platform.collaboration.notification.domain.model.Notification;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.context.UserContext;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/platform/collaboration/notifications")
@SecuredResource(domain = "collaboration", feature = "collaboration", resource = "notification")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final NotificationStreamService notificationStreamService;

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream() {
        UUID userId = UserContext.getUserIdOrNull();
        UUID tenantId = TenantContext.getTenantId();
        if (userId == null) {
            SseEmitter denied = new SseEmitter(0L);
            denied.completeWithError(new IllegalStateException("Authenticated user required"));
            return denied;
        }
        return notificationStreamService.register(tenantId, userId);
    }

    @GetMapping
    public ResponseEntity<Page<Notification>> list(
            Pageable pageable,
            @RequestParam(required = false) String source,
            @RequestParam(required = false) Boolean isRead,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime to) {
        return ResponseEntity.ok(notificationService.listForCurrentUser(source, isRead, from, to, pageable));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> unreadCount() {
        return ResponseEntity.ok(Map.of("count", notificationService.countUnreadForCurrentUser()));
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<Void> markRead(@PathVariable UUID id) {
        notificationService.markRead(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/read-all")
    public ResponseEntity<Void> markAllRead() {
        notificationService.markAllRead();
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/bulk-read")
    public ResponseEntity<Void> markBulkRead(@RequestBody BulkReadRequest request) {
        notificationService.markReadBulk(request.ids());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/read-before")
    public ResponseEntity<Map<String, Long>> deleteReadBefore(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime before) {
        long deleted = notificationService.deleteReadBefore(before);
        return ResponseEntity.ok(Map.of("deleted", deleted));
    }

    public record BulkReadRequest(List<UUID> ids) {
    }
}


