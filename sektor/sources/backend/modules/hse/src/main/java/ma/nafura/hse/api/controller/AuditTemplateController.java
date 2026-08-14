package ma.nafura.hse.api.controller;

import java.util.List;
import ma.nafura.hse.api.dto.AuditTemplateDto;
import ma.nafura.hse.service.AuditTemplateService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/hse/audit-templates")
@SecuredResource(domain = "hse", feature = "audits", resource = "audit-template")
public class AuditTemplateController {

    private final AuditTemplateService service;

    public AuditTemplateController(AuditTemplateService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("hse.audits.read")
    public ResponseEntity<List<AuditTemplateDto>> list() {
        return ResponseEntity.ok(service.listTemplates());
    }
}
