package ma.nafura.hse.api.controller;

import jakarta.validation.Valid;
import java.util.List;
import ma.nafura.hse.api.request.CapaActionCreateDto;
import ma.nafura.hse.api.request.NonConformiteAssignerDto;
import ma.nafura.hse.api.request.NonConformiteCreateDto;
import ma.nafura.hse.api.request.NonConformiteUpdateDto;
import ma.nafura.hse.domain.model.CapaAction;
import ma.nafura.hse.domain.model.NonConformite;
import ma.nafura.hse.service.NonConformiteService;
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
@RequestMapping("/api/v1/hse/non-conformites")
@SecuredResource(domain = "hse", feature = "nc", resource = "non-conformite")
public class NonConformiteController {

    private final NonConformiteService service;

    public NonConformiteController(NonConformiteService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("hse.nc.read")
    public ResponseEntity<List<NonConformite>> list(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String q) {
        String effectiveSearch = search != null && !search.isBlank() ? search : q;
        return ResponseEntity.ok(service.list(status, type, effectiveSearch));
    }

    @GetMapping("/{id}")
    @RequirePermission("hse.nc.read")
    public ResponseEntity<NonConformite> getById(@PathVariable String id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    @RequirePermission("hse.nc.create")
    public ResponseEntity<NonConformite> create(@Valid @RequestBody NonConformiteCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(body));
    }

    @PutMapping("/{id}")
    @RequirePermission("hse.nc.update")
    public ResponseEntity<NonConformite> update(
            @PathVariable String id, @Valid @RequestBody NonConformiteUpdateDto body) {
        return ResponseEntity.ok(service.update(id, body));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("hse.nc.delete")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/assigner")
    @RequirePermission("hse.nc.update")
    public ResponseEntity<NonConformite> assigner(
            @PathVariable String id, @RequestBody(required = false) NonConformiteAssignerDto body) {
        return ResponseEntity.ok(service.assigner(id, body));
    }

    @PostMapping("/{id}/traiter")
    @RequirePermission("hse.nc.update")
    public ResponseEntity<NonConformite> traiter(@PathVariable String id) {
        return ResponseEntity.ok(service.traiter(id));
    }

    @PostMapping("/{id}/verifier")
    @RequirePermission("hse.nc.update")
    public ResponseEntity<NonConformite> verifier(@PathVariable String id) {
        return ResponseEntity.ok(service.verifier(id));
    }

    @PostMapping("/{id}/cloturer")
    @RequirePermission("hse.nc.update")
    public ResponseEntity<NonConformite> cloturer(@PathVariable String id) {
        return ResponseEntity.ok(service.cloturer(id));
    }

    @PostMapping("/{id}/capa")
    @RequirePermission("hse.nc.update")
    public ResponseEntity<CapaAction> createCapa(
            @PathVariable String id, @Valid @RequestBody CapaActionCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.createCapa(id, body));
    }
}
