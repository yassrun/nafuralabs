package ma.nafura.stock.api.controller;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import ma.nafura.stock.api.request.MaterielAffectationCloreDto;
import ma.nafura.stock.api.request.MaterielAffectationCreateDto;
import ma.nafura.stock.api.request.MaterielAffectationUpdateDto;
import ma.nafura.stock.domain.model.MaterielAffectation;
import ma.nafura.stock.service.MaterielAffectationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/materiel-affectations")
@SecuredResource(domain = "stock", feature = "stock", resource = "materiel-affectation")
public class MaterielAffectationController {

    private final MaterielAffectationService service;

    public MaterielAffectationController(MaterielAffectationService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("stock.materiel-affectation.read")
    public ResponseEntity<List<MaterielAffectation>> list(
            @RequestParam(required = false) String materielId,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(service.list(materielId, status));
    }

    @GetMapping("/{id}")
    @RequirePermission("stock.materiel-affectation.read")
    public ResponseEntity<MaterielAffectation> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    @RequirePermission("stock.materiel-affectation.create")
    public ResponseEntity<MaterielAffectation> create(@Valid @RequestBody MaterielAffectationCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(body));
    }

    @PutMapping("/{id}")
    @RequirePermission("stock.materiel-affectation.update")
    public ResponseEntity<MaterielAffectation> update(
            @PathVariable UUID id, @Valid @RequestBody MaterielAffectationUpdateDto body) {
        return ResponseEntity.ok(service.update(id, body));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("stock.materiel-affectation.delete")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/clore")
    @RequirePermission("stock.materiel-affectation.update")
    public ResponseEntity<MaterielAffectation> clore(
            @PathVariable UUID id, @RequestBody(required = false) MaterielAffectationCloreDto body) {
        return ResponseEntity.ok(service.clore(id, body));
    }
}
