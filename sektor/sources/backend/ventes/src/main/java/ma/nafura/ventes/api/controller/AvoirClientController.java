package ma.nafura.ventes.api.controller;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import ma.nafura.ventes.api.request.AvoirClientCreateDto;
import ma.nafura.ventes.api.request.AvoirClientUpdateDto;
import ma.nafura.ventes.domain.model.AvoirClient;
import ma.nafura.ventes.service.AvoirClientService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/avoirs-client")
@SecuredResource(domain = "ventes", feature = "ventes", resource = "avoirs")
public class AvoirClientController {

    private final AvoirClientService service;

    public AvoirClientController(AvoirClientService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("ventes.avoir.read")
    public ResponseEntity<List<AvoirClient>> list(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String clientId,
            @RequestParam(required = false) String factureOriginaleId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String q) {
        String effectiveSearch = search != null && !search.isBlank() ? search : q;
        return ResponseEntity.ok(service.list(status, clientId, factureOriginaleId, effectiveSearch));
    }

    @GetMapping("/by-facture/{factureId}")
    @RequirePermission("ventes.avoir.read")
    public ResponseEntity<List<AvoirClient>> listByFacture(@PathVariable String factureId) {
        return ResponseEntity.ok(service.listByFacture(factureId));
    }

    @GetMapping("/{id}")
    @RequirePermission("ventes.avoir.read")
    public ResponseEntity<AvoirClient> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    @RequirePermission("ventes.avoir.create")
    public ResponseEntity<AvoirClient> create(@Valid @RequestBody AvoirClientCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(body));
    }

    @PutMapping("/{id}")
    @RequirePermission("ventes.avoir.update")
    public ResponseEntity<AvoirClient> update(
            @PathVariable UUID id, @Valid @RequestBody AvoirClientUpdateDto body) {
        return ResponseEntity.ok(service.update(id, body));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("ventes.avoir.delete")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
