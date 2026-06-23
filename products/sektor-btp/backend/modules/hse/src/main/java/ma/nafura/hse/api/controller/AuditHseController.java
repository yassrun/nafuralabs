package ma.nafura.hse.api.controller;

import jakarta.validation.Valid;
import java.util.List;
import ma.nafura.hse.api.dto.AuditClotureResultDto;
import ma.nafura.hse.api.request.AuditHseCreateDto;
import ma.nafura.hse.api.request.AuditHseLigneCreateDto;
import ma.nafura.hse.domain.model.AuditHse;
import ma.nafura.hse.domain.model.AuditHseLigne;
import ma.nafura.hse.service.AuditHseService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/hse/audits")
@SecuredResource(domain = "hse", feature = "audits", resource = "audit")
public class AuditHseController {

    private final AuditHseService service;

    public AuditHseController(AuditHseService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("hse.audits.read")
    public ResponseEntity<List<AuditHse>> list(@RequestParam(required = false) String status) {
        return ResponseEntity.ok(service.list(status));
    }

    @GetMapping("/{id}")
    @RequirePermission("hse.audits.read")
    public ResponseEntity<AuditHse> getById(@PathVariable String id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    @RequirePermission("hse.audits.create")
    public ResponseEntity<AuditHse> create(@Valid @RequestBody AuditHseCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(body));
    }

    @GetMapping("/{id}/lignes")
    @RequirePermission("hse.audits.read")
    public ResponseEntity<List<AuditHseLigne>> listLignes(@PathVariable String id) {
        return ResponseEntity.ok(service.listLignes(id));
    }

    @PostMapping("/{id}/lignes")
    @RequirePermission("hse.audits.update")
    public ResponseEntity<AuditHseLigne> addLigne(
            @PathVariable String id, @Valid @RequestBody AuditHseLigneCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.addLigne(id, body));
    }

    @PostMapping("/{id}/cloturer")
    @RequirePermission("hse.audits.update")
    public ResponseEntity<AuditClotureResultDto> cloturer(@PathVariable String id) {
        return ResponseEntity.ok(service.cloturer(id));
    }
}
