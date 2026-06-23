package ma.nafura.achats.api.controller;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import ma.nafura.achats.api.request.DemandeAchatApproveDto;
import ma.nafura.achats.api.request.DemandeAchatCreateDto;
import ma.nafura.achats.api.request.DemandeAchatRejectDto;
import ma.nafura.achats.api.request.DemandeAchatUpdateDto;
import ma.nafura.achats.domain.model.DemandeAchat;
import ma.nafura.achats.service.DemandeAchatService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/demandes-achat")
@SecuredResource(domain = "achats", feature = "achats", resource = "demande-achat")
public class DemandeAchatController {

    private final DemandeAchatService service;

    public DemandeAchatController(DemandeAchatService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("achats.demande-achat.read")
    public ResponseEntity<List<DemandeAchat>> list(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String chantierId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String q) {
        String effectiveSearch = search != null && !search.isBlank() ? search : q;
        return ResponseEntity.ok(service.list(status, chantierId, effectiveSearch));
    }

    @GetMapping("/{id}")
    @RequirePermission("achats.demande-achat.read")
    public ResponseEntity<DemandeAchat> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    @RequirePermission("achats.demande-achat.create")
    public ResponseEntity<DemandeAchat> create(@Valid @RequestBody DemandeAchatCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(body));
    }

    @PutMapping("/{id}")
    @RequirePermission("achats.demande-achat.update")
    public ResponseEntity<DemandeAchat> update(
            @PathVariable UUID id, @Valid @RequestBody DemandeAchatUpdateDto body) {
        return ResponseEntity.ok(service.update(id, body));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("achats.demande-achat.delete")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/submit")
    @RequirePermission("achats.demande-achat.update")
    public ResponseEntity<DemandeAchat> submit(@PathVariable UUID id) {
        return ResponseEntity.ok(service.submit(id));
    }

    @PostMapping("/{id}/approve")
    @RequirePermission("achats.demande-achat.update")
    public ResponseEntity<DemandeAchat> approve(
            @PathVariable UUID id, @RequestBody(required = false) DemandeAchatApproveDto body) {
        String approbateurId = body != null ? body.getApprobateurId() : null;
        String approbateurName = body != null ? body.getApprobateurName() : null;
        return ResponseEntity.ok(service.approve(id, approbateurId, approbateurName));
    }

    @PostMapping("/{id}/reject")
    @RequirePermission("achats.demande-achat.update")
    public ResponseEntity<DemandeAchat> reject(
            @PathVariable UUID id, @Valid @RequestBody DemandeAchatRejectDto body) {
        return ResponseEntity.ok(service.reject(id, body.getMotifRejet()));
    }

    @PostMapping("/{id}/convert-to-ao")
    @RequirePermission("achats.demande-achat.update")
    public ResponseEntity<DemandeAchat> convertToAo(@PathVariable UUID id) {
        return ResponseEntity.ok(service.convertToAo(id));
    }
}
