package ma.nafura.platform.collaboration.workflow;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import ma.nafura.platform.collaboration.workflow.api.WorkflowTemplateCreateRequest;
import ma.nafura.platform.collaboration.workflow.api.WorkflowTemplateDto;
import ma.nafura.platform.collaboration.workflow.api.WorkflowTemplateUpdateRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/platform/collaboration/workflow/templates")
@SecuredResource(domain = "administration", feature = "administration", resource = "workflows")
@RequiredArgsConstructor
public class WorkflowTemplateController {

    private final WorkflowTemplateService templateService;

    @GetMapping
    @RequirePermission(value = "administration.workflows.read", fullPermission = true)
    public ResponseEntity<Page<WorkflowTemplateDto>> list(Pageable pageable) {
        return ResponseEntity.ok(templateService.list(pageable));
    }

    @GetMapping("/{id}")
    @RequirePermission(value = "administration.workflows.read", fullPermission = true)
    public ResponseEntity<WorkflowTemplateDto> get(@PathVariable UUID id) {
        return ResponseEntity.ok(templateService.get(id));
    }

    @PostMapping
    @RequirePermission(value = "administration.workflows.write", fullPermission = true)
    public ResponseEntity<WorkflowTemplateDto> create(@Valid @RequestBody WorkflowTemplateCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(templateService.create(request));
    }

    @PutMapping("/{id}")
    @RequirePermission(value = "administration.workflows.write", fullPermission = true)
    public ResponseEntity<WorkflowTemplateDto> update(
            @PathVariable UUID id,
            @Valid @RequestBody WorkflowTemplateUpdateRequest request) {
        return ResponseEntity.ok(templateService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @RequirePermission(value = "administration.workflows.write", fullPermission = true)
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        templateService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/active")
    @RequirePermission(value = "administration.workflows.write", fullPermission = true)
    public ResponseEntity<WorkflowTemplateDto> setActive(
            @PathVariable UUID id,
            @RequestParam boolean active) {
        return ResponseEntity.ok(templateService.setActive(id, active));
    }

    @GetMapping("/entity-types")
    @RequirePermission(value = "administration.workflows.read", fullPermission = true)
    public ResponseEntity<Map<String, List<String>>> getEntityTypes() {
        return ResponseEntity.ok(templateService.getEntityTypes());
    }
}
