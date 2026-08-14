package ma.nafura.etudes.api.controller;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import ma.nafura.etudes.api.request.DossierPieceAttendueCreateDto;
import ma.nafura.etudes.api.request.DossierPieceAttendueLierDto;
import ma.nafura.etudes.api.request.DossierPieceAttendueUpdateDto;
import ma.nafura.etudes.api.request.MarcheProposeApplyDto;
import ma.nafura.etudes.domain.model.DossierEtude;
import ma.nafura.etudes.domain.model.DossierPieceAttendue;
import ma.nafura.etudes.service.DossierPieceAttendueService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/etudes/dossiers/{dossierId}/pieces-attendues")
@SecuredResource(domain = "etudes", feature = "etudes", resource = "dossier")
public class DossierPieceAttendueController {

    private final DossierPieceAttendueService service;

    public DossierPieceAttendueController(DossierPieceAttendueService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("etude.read")
    public ResponseEntity<List<DossierPieceAttendue>> lister(@PathVariable UUID dossierId) {
        return ResponseEntity.ok(service.lister(dossierId));
    }

    @PostMapping
    @RequirePermission("etude.update")
    public ResponseEntity<?> creer(
            @PathVariable UUID dossierId, @Valid @RequestBody DossierPieceAttendueCreateDto body) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(service.creer(dossierId, body));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("code", ex.getMessage()));
        }
    }

    /** Applique une proposition CPS (métadonnées + upsert pièces) — avant les routes {pieceId}. */
    @PostMapping("/appliquer-proposition")
    @RequirePermission("etude.update")
    public ResponseEntity<?> appliquerProposition(
            @PathVariable UUID dossierId, @RequestBody MarcheProposeApplyDto body) {
        try {
            DossierEtude dossier = service.appliquerProposition(dossierId, body);
            return ResponseEntity.ok(dossier);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("code", ex.getMessage()));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("code", ex.getMessage()));
        }
    }

    @PatchMapping("/{pieceId}")
    @RequirePermission("etude.update")
    public ResponseEntity<?> update(
            @PathVariable UUID dossierId,
            @PathVariable UUID pieceId,
            @Valid @RequestBody DossierPieceAttendueUpdateDto body) {
        try {
            return ResponseEntity.ok(service.update(dossierId, pieceId, body));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("code", ex.getMessage()));
        }
    }

    @DeleteMapping("/{pieceId}")
    @RequirePermission("etude.update")
    public ResponseEntity<?> supprimer(@PathVariable UUID dossierId, @PathVariable UUID pieceId) {
        try {
            service.supprimer(dossierId, pieceId);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("code", ex.getMessage()));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("code", ex.getMessage()));
        }
    }

    @PostMapping("/{pieceId}/lier")
    @RequirePermission("etude.update")
    public ResponseEntity<?> lier(
            @PathVariable UUID dossierId,
            @PathVariable UUID pieceId,
            @Valid @RequestBody DossierPieceAttendueLierDto body) {
        try {
            return ResponseEntity.ok(service.lier(dossierId, pieceId, body.getDossierDocumentId()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("code", ex.getMessage()));
        }
    }
}
