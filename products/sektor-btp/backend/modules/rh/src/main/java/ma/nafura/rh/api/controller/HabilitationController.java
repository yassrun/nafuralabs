package ma.nafura.rh.api.controller;

import jakarta.validation.Valid;
import java.util.List;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import ma.nafura.rh.api.request.HabilitationCreateDto;
import ma.nafura.rh.api.request.HabilitationUpdateDto;
import ma.nafura.rh.domain.model.Habilitation;
import ma.nafura.rh.service.HabilitationService;
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
@RequestMapping("/api/v1/rh/habilitations")
@SecuredResource(domain = "rh", feature = "habilitations", resource = "habilitation")
public class HabilitationController {

    private final HabilitationService service;

    public HabilitationController(HabilitationService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("rh.habilitations.read")
    public ResponseEntity<List<Habilitation>> list(
            @RequestParam(required = false) String employeId,
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String q) {
        String effectiveSearch = search != null && !search.isBlank() ? search : q;
        return ResponseEntity.ok(service.list(employeId, code, effectiveSearch));
    }

    @GetMapping("/expirant")
    @RequirePermission("rh.habilitations.read")
    public ResponseEntity<List<Habilitation>> listExpirant(
            @RequestParam(defaultValue = "30") int days, @RequestParam(required = false) String employeId) {
        return ResponseEntity.ok(service.listExpirant(days, employeId));
    }

    @GetMapping("/{id}")
    @RequirePermission("rh.habilitations.read")
    public ResponseEntity<Habilitation> getById(@PathVariable String id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    @RequirePermission("rh.habilitations.create")
    public ResponseEntity<Habilitation> create(@Valid @RequestBody HabilitationCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(body));
    }

    @PutMapping("/{id}")
    @RequirePermission("rh.habilitations.update")
    public ResponseEntity<Habilitation> update(@PathVariable String id, @Valid @RequestBody HabilitationUpdateDto body) {
        return ResponseEntity.ok(service.update(id, body));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("rh.habilitations.delete")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
