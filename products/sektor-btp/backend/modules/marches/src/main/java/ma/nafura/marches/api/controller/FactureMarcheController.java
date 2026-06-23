package ma.nafura.marches.api.controller;

import jakarta.validation.Valid;
import java.util.List;
import ma.nafura.marches.api.request.FactureMarcheCreateDto;
import ma.nafura.marches.domain.model.FactureMarche;
import ma.nafura.marches.service.FactureMarcheService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/marches/factures")
@SecuredResource(domain = "marches", feature = "marches", resource = "facture")
public class FactureMarcheController {

    private final FactureMarcheService service;

    public FactureMarcheController(FactureMarcheService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("marches.facture.read")
    public ResponseEntity<List<FactureMarche>> list(
            @RequestParam(required = false) String contratId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String q) {
        String effectiveSearch = search != null && !search.isBlank() ? search : q;
        return ResponseEntity.ok(service.list(contratId, status, effectiveSearch));
    }

    @GetMapping("/{id}")
    @RequirePermission("marches.facture.read")
    public ResponseEntity<FactureMarche> getById(@PathVariable String id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    @RequirePermission("marches.facture.create")
    public ResponseEntity<FactureMarche> create(@Valid @RequestBody FactureMarcheCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(body));
    }

    @PostMapping("/{id}/valider")
    @RequirePermission("marches.facture.update")
    public ResponseEntity<FactureMarche> valider(@PathVariable String id) {
        return ResponseEntity.ok(service.valider(id));
    }
}
