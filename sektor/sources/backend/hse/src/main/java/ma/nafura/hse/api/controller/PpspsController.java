package ma.nafura.hse.api.controller;

import jakarta.validation.Valid;
import java.util.List;
import ma.nafura.hse.api.request.PpspsCreateDto;
import ma.nafura.hse.api.request.PpspsSectionCreateDto;
import ma.nafura.hse.domain.model.Ppsps;
import ma.nafura.hse.domain.model.PpspsSection;
import ma.nafura.hse.service.PpspsService;
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
@RequestMapping("/api/v1/hse/ppsps")
@SecuredResource(domain = "hse", feature = "ppsps", resource = "ppsps")
public class PpspsController {

    private final PpspsService service;

    public PpspsController(PpspsService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("hse.ppsps.read")
    public ResponseEntity<List<Ppsps>> list(@RequestParam(required = false) String chantierId) {
        return ResponseEntity.ok(service.list(chantierId));
    }

    @PostMapping
    @RequirePermission("hse.ppsps.create")
    public ResponseEntity<Ppsps> create(@Valid @RequestBody PpspsCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(body));
    }

    @GetMapping("/{id}/sections")
    @RequirePermission("hse.ppsps.read")
    public ResponseEntity<List<PpspsSection>> listSections(@PathVariable String id) {
        return ResponseEntity.ok(service.listSections(id));
    }

    @PostMapping("/{id}/sections")
    @RequirePermission("hse.ppsps.update")
    public ResponseEntity<PpspsSection> addSection(
            @PathVariable String id, @Valid @RequestBody PpspsSectionCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.addSection(id, body));
    }

    @GetMapping("/{id}/pdf")
    @RequirePermission("hse.ppsps.read")
    public ResponseEntity<Void> pdf(@PathVariable String id) {
        service.getById(id);
        return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).build();
    }

    @PostMapping("/{id}/versions")
    @RequirePermission("hse.ppsps.update")
    public ResponseEntity<Ppsps> newVersion(@PathVariable String id) {
        return ResponseEntity.ok(service.incrementVersion(id));
    }
}
