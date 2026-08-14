package ma.nafura.rh.api.controller;

import jakarta.validation.Valid;
import java.util.List;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import ma.nafura.rh.api.request.ContratCreateDto;
import ma.nafura.rh.api.request.ContratSignCanvasDto;
import ma.nafura.rh.api.request.ContratUpdateDto;
import ma.nafura.rh.domain.model.Contrat;
import ma.nafura.rh.service.ContratService;
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
@RequestMapping("/api/v1/rh/contrats")
@SecuredResource(domain = "rh", feature = "contrats", resource = "contrat")
public class ContratController {

    private final ContratService service;

    public ContratController(ContratService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("rh.contrats.read")
    public ResponseEntity<List<Contrat>> list(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String employeId,
            @RequestParam(required = false) String typeContrat,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String q) {
        String effectiveSearch = search != null && !search.isBlank() ? search : q;
        return ResponseEntity.ok(service.list(status, employeId, typeContrat, effectiveSearch));
    }

    @GetMapping("/{id}")
    @RequirePermission("rh.contrats.read")
    public ResponseEntity<Contrat> getById(@PathVariable String id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    @RequirePermission("rh.contrats.create")
    public ResponseEntity<Contrat> create(@Valid @RequestBody ContratCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(body));
    }

    @PutMapping("/{id}")
    @RequirePermission("rh.contrats.update")
    public ResponseEntity<Contrat> update(@PathVariable String id, @Valid @RequestBody ContratUpdateDto body) {
        return ResponseEntity.ok(service.update(id, body));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("rh.contrats.delete")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/sign-canvas")
    @RequirePermission("rh.contrats.update")
    public ResponseEntity<Contrat> signCanvas(
            @PathVariable String id, @Valid @RequestBody ContratSignCanvasDto body) {
        return ResponseEntity.ok(service.signCanvas(id, body));
    }
}
