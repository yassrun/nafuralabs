package ma.nafura.achats.api.controller;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import ma.nafura.achats.api.dto.PartnerAttestationsStatusDto;
import ma.nafura.achats.api.request.AttestationFournisseurCreateDto;
import ma.nafura.achats.api.request.AttestationFournisseurUpdateDto;
import ma.nafura.achats.domain.model.AttestationFournisseur;
import ma.nafura.achats.service.AttestationFournisseurService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/attestations-fournisseur")
@SecuredResource(domain = "achats", feature = "achats", resource = "attestation-fournisseur")
public class AttestationFournisseurController {

    private final AttestationFournisseurService service;

    public AttestationFournisseurController(AttestationFournisseurService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("achats.attestation-fournisseur.read")
    public ResponseEntity<List<AttestationFournisseur>> list(
            @RequestParam(required = false) String partnerId, @RequestParam(required = false) String status) {
        return ResponseEntity.ok(service.list(partnerId, status));
    }

    @GetMapping("/{id}")
    @RequirePermission("achats.attestation-fournisseur.read")
    public ResponseEntity<AttestationFournisseur> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @GetMapping("/partner/{partnerId}/status")
    @RequirePermission("achats.attestation-fournisseur.read")
    public ResponseEntity<PartnerAttestationsStatusDto> partnerStatus(@PathVariable String partnerId) {
        return ResponseEntity.ok(service.partnerStatus(partnerId));
    }

    @PostMapping
    @RequirePermission("achats.attestation-fournisseur.create")
    public ResponseEntity<AttestationFournisseur> create(@Valid @RequestBody AttestationFournisseurCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(body));
    }

    @PutMapping("/{id}")
    @RequirePermission("achats.attestation-fournisseur.update")
    public ResponseEntity<AttestationFournisseur> update(
            @PathVariable UUID id, @Valid @RequestBody AttestationFournisseurUpdateDto body) {
        return ResponseEntity.ok(service.update(id, body));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("achats.attestation-fournisseur.delete")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
