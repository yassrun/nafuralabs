package ma.nafura.platform.collaboration.workflow;

import ma.nafura.platform.collaboration.workflow.api.WorkflowTemplateDto;
import ma.nafura.platform.collaboration.workflow.domain.model.WorkflowInstance;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/platform/collaboration/workflows")
@SecuredResource(domain = "collaboration", feature = "collaboration", resource = "workflow")
@RequiredArgsConstructor
public class WorkflowController {

    private final WorkflowEngine workflowEngine;
    private final WorkflowTemplateService workflowTemplateService;

    @GetMapping("/templates")
    public ResponseEntity<List<WorkflowTemplateDto>> listTemplates(
            @RequestParam String entityType) {
        return ResponseEntity.ok(workflowTemplateService.listByEntityType(entityType));
    }

    @PostMapping("/trigger")
    public ResponseEntity<WorkflowInstance> trigger(
            @RequestParam String event,
            @RequestBody WorkflowContext context) {
        WorkflowInstance instance = workflowEngine.trigger(event, context);
        return instance != null ? ResponseEntity.ok(instance) : ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/advance")
    public ResponseEntity<Void> advance(@PathVariable UUID id) {
        workflowEngine.advance(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<Void> complete(@PathVariable UUID id) {
        workflowEngine.complete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<Void> cancel(@PathVariable UUID id) {
        workflowEngine.cancel(id);
        return ResponseEntity.noContent().build();
    }
}


