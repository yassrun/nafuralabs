package ma.nafura.achats.api.controller;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import ma.nafura.achats.api.request.ContratFournisseurCreateDto;
import ma.nafura.achats.api.request.ContratFournisseurUpdateDto;
import ma.nafura.achats.domain.model.ContratFournisseur;
import ma.nafura.achats.service.ContratFournisseurService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/contrats-fournisseur")
@SecuredResource(domain = "achats", feature = "achats", resource = "contrat-fournisseur")
public class ContratFournisseurController {

    private final ContratFournisseurService service;

    public ContratFournisseurController(ContratFournisseurService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("achats.contrat-fournisseur.read")
    public ResponseEntity<List<ContratFournisseur>> list(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String fournisseurId,
            @RequestParam(required = false) String chantierId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String q) {
        String effectiveSearch = search != null && !search.isBlank() ? search : q;
        return ResponseEntity.ok(service.list(type, status, fournisseurId, chantierId, effectiveSearch));
    }

    @GetMapping("/{id}")
    @RequirePermission("achats.contrat-fournisseur.read")
    public ResponseEntity<ContratFournisseur> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    @RequirePermission("achats.contrat-fournisseur.create")
    public ResponseEntity<ContratFournisseur> create(@Valid @RequestBody ContratFournisseurCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(body));
    }

    @PutMapping("/{id}")
    @RequirePermission("achats.contrat-fournisseur.update")
    public ResponseEntity<ContratFournisseur> update(
            @PathVariable UUID id, @Valid @RequestBody ContratFournisseurUpdateDto body) {
        return ResponseEntity.ok(service.update(id, body));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("achats.contrat-fournisseur.delete")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/sign")
    @RequirePermission("achats.contrat-fournisseur.update")
    public ResponseEntity<ContratFournisseur> sign(@PathVariable UUID id) {
        return ResponseEntity.ok(service.sign(id));
    }

    @PostMapping("/{id}/terminate")
    @RequirePermission("achats.contrat-fournisseur.update")
    public ResponseEntity<ContratFournisseur> terminate(@PathVariable UUID id) {
        return ResponseEntity.ok(service.terminate(id));
    }
}
