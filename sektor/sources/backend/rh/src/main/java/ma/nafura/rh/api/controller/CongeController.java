package ma.nafura.rh.api.controller;

import jakarta.validation.Valid;
import java.util.List;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import ma.nafura.rh.api.request.CongeCreateDto;
import ma.nafura.rh.api.request.CongeRejectDto;
import ma.nafura.rh.api.request.CongeUpdateDto;
import ma.nafura.rh.domain.model.Conge;
import ma.nafura.rh.service.CongeService;
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
@RequestMapping("/api/v1/rh/conges")
@SecuredResource(domain = "rh", feature = "conges", resource = "conge")
public class CongeController {

    private final CongeService service;

    public CongeController(CongeService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("rh.conges.read")
    public ResponseEntity<List<Conge>> list(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String employeId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String q) {
        String effectiveSearch = search != null && !search.isBlank() ? search : q;
        return ResponseEntity.ok(service.list(status, type, employeId, effectiveSearch));
    }

    @GetMapping("/{id}")
    @RequirePermission("rh.conges.read")
    public ResponseEntity<Conge> getById(@PathVariable String id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    @RequirePermission("rh.conges.create")
    public ResponseEntity<Conge> create(@Valid @RequestBody CongeCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(body));
    }

    @PutMapping("/{id}")
    @RequirePermission("rh.conges.update")
    public ResponseEntity<Conge> update(@PathVariable String id, @Valid @RequestBody CongeUpdateDto body) {
        return ResponseEntity.ok(service.update(id, body));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("rh.conges.delete")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/submit")
    @RequirePermission("rh.conges.update")
    public ResponseEntity<Conge> submit(@PathVariable String id) {
        return ResponseEntity.ok(service.submit(id));
    }

    @PostMapping("/{id}/approve")
    @RequirePermission("rh.conges.update")
    public ResponseEntity<Conge> approve(@PathVariable String id) {
        return ResponseEntity.ok(service.approve(id));
    }

    @PostMapping("/{id}/reject")
    @RequirePermission("rh.conges.update")
    public ResponseEntity<Conge> reject(@PathVariable String id, @Valid @RequestBody CongeRejectDto body) {
        return ResponseEntity.ok(service.reject(id, body.getMotifRefus()));
    }
}
