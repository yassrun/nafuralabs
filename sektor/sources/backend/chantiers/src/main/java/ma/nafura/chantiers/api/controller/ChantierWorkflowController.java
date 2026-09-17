package ma.nafura.chantiers.api.controller;

import ma.nafura.chantiers.service.ChantierWorkflowService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/chantiers/{id}/workflow")
@SecuredResource(domain = "chantiers", feature = "chantiers", resource = "chantier")
public class ChantierWorkflowController {
    private final ChantierWorkflowService service;
    public ChantierWorkflowController(ChantierWorkflowService service) { this.service = service; }
    @GetMapping
    @RequirePermission("chantiers.read")
    public ChantierWorkflowService.View get(@PathVariable String id) { return service.get(id); }
    @PostMapping
    @RequirePermission("chantiers.update")
    public ChantierWorkflowService.View execute(@PathVariable String id, @RequestBody ChantierWorkflowService.Command body) { return service.execute(id, body); }
}
