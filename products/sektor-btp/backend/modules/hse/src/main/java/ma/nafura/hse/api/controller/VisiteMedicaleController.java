package ma.nafura.hse.api.controller;

import jakarta.validation.Valid;
import java.util.List;
import ma.nafura.hse.api.request.VisiteMedicaleCreateDto;
import ma.nafura.hse.api.request.VisiteMedicaleUpdateDto;
import ma.nafura.hse.domain.model.VisiteMedicale;
import ma.nafura.hse.service.VisiteMedicaleService;
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
@RequestMapping("/api/v1/hse/visites-medicales")
@SecuredResource(domain = "hse", feature = "visites-medicales", resource = "visite-medicale")
public class VisiteMedicaleController {

    private final VisiteMedicaleService service;

    public VisiteMedicaleController(VisiteMedicaleService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("hse.visites-medicales.read")
    public ResponseEntity<List<VisiteMedicale>> list(
            @RequestParam(required = false) String employeId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String q) {
        String effectiveSearch = search != null && !search.isBlank() ? search : q;
        return ResponseEntity.ok(service.list(employeId, effectiveSearch));
    }

    @GetMapping("/echeances")
    @RequirePermission("hse.visites-medicales.read")
    public ResponseEntity<List<VisiteMedicale>> listEcheances(@RequestParam(defaultValue = "60") int days) {
        return ResponseEntity.ok(service.listEcheances(days));
    }

    @GetMapping("/{id}")
    @RequirePermission("hse.visites-medicales.read")
    public ResponseEntity<VisiteMedicale> getById(@PathVariable String id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    @RequirePermission("hse.visites-medicales.create")
    public ResponseEntity<VisiteMedicale> create(@Valid @RequestBody VisiteMedicaleCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(body));
    }

    @PutMapping("/{id}")
    @RequirePermission("hse.visites-medicales.update")
    public ResponseEntity<VisiteMedicale> update(
            @PathVariable String id, @Valid @RequestBody VisiteMedicaleUpdateDto body) {
        return ResponseEntity.ok(service.update(id, body));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("hse.visites-medicales.delete")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
