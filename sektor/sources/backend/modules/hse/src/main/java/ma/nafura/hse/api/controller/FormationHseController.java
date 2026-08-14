package ma.nafura.hse.api.controller;

import jakarta.validation.Valid;
import java.util.List;
import ma.nafura.hse.api.request.FormationHseCreateDto;
import ma.nafura.hse.api.request.FormationHseUpdateDto;
import ma.nafura.hse.domain.model.FormationHse;
import ma.nafura.hse.service.FormationHseService;
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
@RequestMapping("/api/v1/hse/formations")
@SecuredResource(domain = "hse", feature = "formations", resource = "formation")
public class FormationHseController {

    private final FormationHseService service;

    public FormationHseController(FormationHseService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("hse.formations.read")
    public ResponseEntity<List<FormationHse>> list(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String q) {
        String effectiveSearch = search != null && !search.isBlank() ? search : q;
        return ResponseEntity.ok(service.list(status, effectiveSearch));
    }

    @GetMapping("/expirant")
    @RequirePermission("hse.formations.read")
    public ResponseEntity<List<FormationHse>> listExpirant(@RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(service.listExpirant(days));
    }

    @GetMapping("/{id}")
    @RequirePermission("hse.formations.read")
    public ResponseEntity<FormationHse> getById(@PathVariable String id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    @RequirePermission("hse.formations.create")
    public ResponseEntity<FormationHse> create(@Valid @RequestBody FormationHseCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(body));
    }

    @PutMapping("/{id}")
    @RequirePermission("hse.formations.update")
    public ResponseEntity<FormationHse> update(
            @PathVariable String id, @Valid @RequestBody FormationHseUpdateDto body) {
        return ResponseEntity.ok(service.update(id, body));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("hse.formations.delete")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/cloturer")
    @RequirePermission("hse.formations.update")
    public ResponseEntity<FormationHse> cloturer(@PathVariable String id) {
        return ResponseEntity.ok(service.cloturer(id));
    }
}
