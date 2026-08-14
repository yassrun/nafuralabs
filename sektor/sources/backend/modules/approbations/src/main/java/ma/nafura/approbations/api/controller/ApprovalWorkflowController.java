package ma.nafura.approbations.api.controller;

import jakarta.validation.Valid;
import java.util.List;
import ma.nafura.approbations.api.request.ApprovalWorkflowCreateDto;
import ma.nafura.approbations.api.request.ApprovalWorkflowUpdateDto;
import ma.nafura.approbations.domain.model.ApprovalWorkflow;
import ma.nafura.approbations.service.ApprovalWorkflowService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/approbations/workflows")
@SecuredResource(domain = "approbations", feature = "workflows", resource = "workflow")
public class ApprovalWorkflowController {

    private final ApprovalWorkflowService service;

    public ApprovalWorkflowController(ApprovalWorkflowService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("approbations.workflows.read")
    public ResponseEntity<List<ApprovalWorkflow>> list(@RequestParam(required = false) String entityType) {
        return ResponseEntity.ok(service.list(entityType));
    }

    @GetMapping("/{id}")
    @RequirePermission("approbations.workflows.read")
    public ResponseEntity<ApprovalWorkflow> getById(@PathVariable String id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    @RequirePermission("approbations.workflows.create")
    public ResponseEntity<ApprovalWorkflow> create(@Valid @RequestBody ApprovalWorkflowCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(body));
    }

    @PutMapping("/{id}")
    @RequirePermission("approbations.workflows.update")
    public ResponseEntity<ApprovalWorkflow> update(
            @PathVariable String id, @Valid @RequestBody ApprovalWorkflowUpdateDto body) {
        return ResponseEntity.ok(service.update(id, body));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("approbations.workflows.delete")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
