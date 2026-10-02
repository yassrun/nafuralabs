package ma.nafura.platform.collaboration.workflow;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import lombok.RequiredArgsConstructor;
import ma.nafura.platform.collaboration.workflow.api.ApprovalDashboardItem;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * The caller's approval inbox. Open to every member: the service lists only the steps of the caller's
 * roles in the current tenant, and only a holder of a step's role may decide it.
 */
@RestController
@RequestMapping("/api/v1/platform/collaboration/approvals")
@RequiredArgsConstructor
public class ApprovalInboxController {

    private final ApprovalService approvalService;

    @GetMapping("/pending")
    public List<ApprovalDashboardItem> pending() {
        return approvalService.getPendingForCurrentUser();
    }

    @GetMapping("/pending/count")
    public Map<String, Long> pendingCount() {
        return Map.of("count", approvalService.getPendingCountForCurrentUser());
    }

    @GetMapping("/history")
    public List<ApprovalDashboardItem> history() {
        return approvalService.getHistoryForCurrentUser();
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<Void> approve(@PathVariable UUID id, @RequestBody(required = false) Decision body) {
        approvalService.approve(id, body != null ? body.comment() : null);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<Void> reject(@PathVariable UUID id, @RequestBody(required = false) Decision body) {
        approvalService.reject(id, body != null ? body.comment() : null);
        return ResponseEntity.noContent().build();
    }

    public record Decision(String comment) {
    }
}
