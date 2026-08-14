package ma.nafura.ventes.api.controller;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import ma.nafura.ventes.api.request.BonCommandeClientCreateDto;
import ma.nafura.ventes.api.request.BonCommandeClientUpdateDto;
import ma.nafura.ventes.domain.model.BonCommandeClient;
import ma.nafura.ventes.service.BonCommandeClientService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/bons-commande-client")
@SecuredResource(domain = "ventes", feature = "ventes", resource = "bcc")
public class BonCommandeClientController {

    private final BonCommandeClientService service;

    public BonCommandeClientController(BonCommandeClientService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("ventes.bcc.read")
    public ResponseEntity<List<BonCommandeClient>> list(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String clientId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String q) {
        String effectiveSearch = search != null && !search.isBlank() ? search : q;
        return ResponseEntity.ok(service.list(status, clientId, effectiveSearch));
    }

    @GetMapping("/{id}")
    @RequirePermission("ventes.bcc.read")
    public ResponseEntity<BonCommandeClient> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    @RequirePermission("ventes.bcc.create")
    public ResponseEntity<BonCommandeClient> create(@Valid @RequestBody BonCommandeClientCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(body));
    }

    @PutMapping("/{id}")
    @RequirePermission("ventes.bcc.update")
    public ResponseEntity<BonCommandeClient> update(
            @PathVariable UUID id, @Valid @RequestBody BonCommandeClientUpdateDto body) {
        return ResponseEntity.ok(service.update(id, body));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("ventes.bcc.delete")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/confirm")
    @RequirePermission("ventes.bcc.update")
    public ResponseEntity<BonCommandeClient> confirm(@PathVariable UUID id) {
        return ResponseEntity.ok(service.confirm(id));
    }

    @PostMapping("/{id}/convert-to-facture")
    @RequirePermission("ventes.bcc.update")
    public ResponseEntity<BonCommandeClient> convertToFacture(@PathVariable UUID id) {
        return ResponseEntity.ok(service.convertToFacture(id));
    }
}
