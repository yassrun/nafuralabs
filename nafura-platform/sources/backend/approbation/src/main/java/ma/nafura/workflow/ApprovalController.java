package ma.nafura.platform.collaboration.workflow;

import ma.nafura.platform.collaboration.workflow.domain.model.ApprovalRequest;
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
@RequestMapping("/api/v1/platform/collaboration/approvals")
@SecuredResource(domain = "collaboration", feature = "collaboration", resource = "approval")
@RequiredArgsConstructor
public class ApprovalController {

    private final ApprovalService approvalService;

    @GetMapping
    public ResponseEntity<Page<ApprovalRequest>> list(
            @RequestParam String entityType,
            @RequestParam UUID entityId,
            Pageable pageable) {
        return ResponseEntity.ok(approvalService.listByEntity(entityType, entityId, pageable));
    }

    @GetMapping(value = "/pending", params = {"entityType", "entityId"})
    public ResponseEntity<List<ApprovalRequest>> pendingOf(
            @RequestParam String entityType,
            @RequestParam UUID entityId) {
        return ResponseEntity.ok(approvalService.findPendingByEntity(entityType, entityId));
    }

    @PostMapping("/request")
    public ResponseEntity<ApprovalRequest> requestApproval(
            @Valid @RequestBody RequestApprovalRequest body) {
        ApprovalRequest request = approvalService.requestApproval(
                body.getEntityType(),
                body.getEntityId(),
                body.getTitle(),
                body.getWorkflow() != null ? body.getWorkflow() : List.of());
        return ResponseEntity.status(HttpStatus.CREATED).body(request);
    }

    @lombok.Data
    public static class RequestApprovalRequest {
        @NotBlank private String entityType;
        @NotNull private UUID entityId;
        @NotBlank private String title;
        private List<ApprovalStepDefinition> workflow;
    }
}


