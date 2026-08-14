package ma.nafura.ventes.api.controller;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import ma.nafura.ventes.api.request.EncaissementClientCreateDto;
import ma.nafura.ventes.api.request.FactureClientCreateDto;
import ma.nafura.ventes.api.request.FactureClientUpdateDto;
import ma.nafura.ventes.domain.model.EncaissementClient;
import ma.nafura.ventes.domain.model.FactureClient;
import ma.nafura.ventes.service.EncaissementClientService;
import ma.nafura.ventes.service.FactureClientService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/factures-client")
@SecuredResource(domain = "ventes", feature = "ventes", resource = "factures")
public class FactureClientController {

    private final FactureClientService service;
    private final EncaissementClientService encaissementService;

    public FactureClientController(
            FactureClientService service, EncaissementClientService encaissementService) {
        this.service = service;
        this.encaissementService = encaissementService;
    }

    @GetMapping
    @RequirePermission("ventes.factures.read")
    public ResponseEntity<List<FactureClient>> list(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String clientId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String q) {
        String effectiveSearch = search != null && !search.isBlank() ? search : q;
        return ResponseEntity.ok(service.list(status, clientId, effectiveSearch));
    }

    @GetMapping("/{id}")
    @RequirePermission("ventes.factures.read")
    public ResponseEntity<FactureClient> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    @RequirePermission("ventes.factures.create")
    public ResponseEntity<FactureClient> create(@Valid @RequestBody FactureClientCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(body));
    }

    @PutMapping("/{id}")
    @RequirePermission("ventes.factures.update")
    public ResponseEntity<FactureClient> update(
            @PathVariable UUID id, @Valid @RequestBody FactureClientUpdateDto body) {
        return ResponseEntity.ok(service.update(id, body));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("ventes.factures.delete")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/encaissements")
    @RequirePermission("ventes.factures.read")
    public ResponseEntity<List<EncaissementClient>> listEncaissements(@PathVariable UUID id) {
        return ResponseEntity.ok(encaissementService.listByFacture(id));
    }

    @PostMapping("/{id}/encaissements")
    @RequirePermission("ventes.factures.update")
    public ResponseEntity<FactureClient> addEncaissement(
            @PathVariable UUID id, @Valid @RequestBody EncaissementClientCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(encaissementService.add(id, body));
    }

    @DeleteMapping("/{id}/encaissements/{encaissementId}")
    @RequirePermission("ventes.factures.update")
    public ResponseEntity<FactureClient> removeEncaissement(
            @PathVariable UUID id, @PathVariable UUID encaissementId) {
        return ResponseEntity.ok(encaissementService.remove(id, encaissementId));
    }
}
