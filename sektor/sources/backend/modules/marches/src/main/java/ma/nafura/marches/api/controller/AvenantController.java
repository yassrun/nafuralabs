package ma.nafura.marches.api.controller;

import jakarta.validation.Valid;
import java.util.List;
import ma.nafura.marches.api.dto.AvenantImpactSimulationDto;
import ma.nafura.marches.api.request.AvenantCreateDto;
import ma.nafura.marches.domain.model.Avenant;
import ma.nafura.marches.service.AvenantService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/marches/avenants")
@SecuredResource(domain = "marches", feature = "marches", resource = "avenant")
public class AvenantController {

    private final AvenantService service;

    public AvenantController(AvenantService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("marches.avenant.read")
    public ResponseEntity<List<Avenant>> list(
            @RequestParam(required = false) String contratMarcheId,
            @RequestParam(required = false) String contratId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String q) {
        String effectiveContrat = contratMarcheId != null && !contratMarcheId.isBlank() ? contratMarcheId : contratId;
        String effectiveSearch = search != null && !search.isBlank() ? search : q;
        return ResponseEntity.ok(service.list(effectiveContrat, status, effectiveSearch));
    }

    @GetMapping("/{id}")
    @RequirePermission("marches.avenant.read")
    public ResponseEntity<Avenant> getById(@PathVariable String id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    @RequirePermission("marches.avenant.create")
    public ResponseEntity<Avenant> create(@Valid @RequestBody AvenantCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(body));
    }

    @PostMapping("/{id}/soumettre-moa")
    @RequirePermission("marches.avenant.update")
    public ResponseEntity<Avenant> soumettreMoa(@PathVariable String id) {
        return ResponseEntity.ok(service.soumettreMoa(id));
    }

    @PostMapping("/{id}/signer")
    @RequirePermission("marches.avenant.update")
    public ResponseEntity<Avenant> signer(@PathVariable String id) {
        return ResponseEntity.ok(service.signer(id));
    }

    @PostMapping("/{id}/propager-impact")
    @RequirePermission("marches.avenant.update")
    public ResponseEntity<Avenant> propagerImpact(@PathVariable String id) {
        return ResponseEntity.ok(service.propagerImpact(id));
    }

    @PostMapping("/{id}/annuler")
    @RequirePermission("marches.avenant.update")
    public ResponseEntity<Avenant> annuler(@PathVariable String id) {
        return ResponseEntity.ok(service.annuler(id));
    }

    @GetMapping("/{id}/impact-simulation")
    @RequirePermission("marches.avenant.read")
    public ResponseEntity<AvenantImpactSimulationDto> impactSimulation(@PathVariable String id) {
        return ResponseEntity.ok(service.impactSimulation(id));
    }
}
