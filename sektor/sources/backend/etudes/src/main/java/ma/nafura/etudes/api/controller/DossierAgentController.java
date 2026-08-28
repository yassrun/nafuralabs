package ma.nafura.etudes.api.controller;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import ma.nafura.etudes.api.dto.DossierAgentContextDto;
import ma.nafura.etudes.api.dto.DossierAgentSuggestionDto;
import ma.nafura.etudes.api.request.DossierAgentCorrigerDto;
import ma.nafura.etudes.service.DossierAgentService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/** Panneau agent contextuel du dossier ouvert (SEKTOR-218 AC-16). Pas de chat générique. */
@RestController
@RequestMapping("/api/v1/etudes/dossiers/{dossierId}/agent")
@SecuredResource(domain = "etudes", feature = "etudes", resource = "dossier")
public class DossierAgentController {

    private final DossierAgentService service;

    public DossierAgentController(DossierAgentService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("etude.read")
    public ResponseEntity<DossierAgentContextDto> contexte(@PathVariable UUID dossierId) {
        return ResponseEntity.ok(service.contexte(dossierId));
    }

    @PostMapping("/actions/chiffrage")
    @RequirePermission("etude.read")
    public ResponseEntity<List<DossierAgentSuggestionDto>> chiffrage(@PathVariable UUID dossierId) {
        return ResponseEntity.ok(service.proposerChiffrage(dossierId));
    }

    @PostMapping("/actions/incoherences")
    @RequirePermission("etude.read")
    public ResponseEntity<List<DossierAgentSuggestionDto>> incoherences(@PathVariable UUID dossierId) {
        return ResponseEntity.ok(service.proposerIncoherences(dossierId));
    }

    @PostMapping("/actions/rattachements-catalogue")
    @RequirePermission("etude.read")
    public ResponseEntity<List<DossierAgentSuggestionDto>> rattachements(@PathVariable UUID dossierId) {
        return ResponseEntity.ok(service.proposerRattachementsCatalogue(dossierId));
    }

    @PostMapping("/suggestions/{suggestionId}/accepter")
    @RequirePermission("etude.update")
    public ResponseEntity<?> accepter(
            @PathVariable UUID dossierId, @PathVariable UUID suggestionId) {
        try {
            return ResponseEntity.ok(service.accepter(dossierId, suggestionId));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("code", ex.getMessage()));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("code", ex.getMessage()));
        }
    }

    @PostMapping("/suggestions/{suggestionId}/refuser")
    @RequirePermission("etude.update")
    public ResponseEntity<?> refuser(
            @PathVariable UUID dossierId, @PathVariable UUID suggestionId) {
        try {
            return ResponseEntity.ok(service.refuser(dossierId, suggestionId));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("code", ex.getMessage()));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("code", ex.getMessage()));
        }
    }

    @PostMapping("/suggestions/{suggestionId}/corriger")
    @RequirePermission("etude.update")
    public ResponseEntity<?> corriger(
            @PathVariable UUID dossierId,
            @PathVariable UUID suggestionId,
            @Valid @RequestBody DossierAgentCorrigerDto body) {
        try {
            return ResponseEntity.ok(service.corriger(dossierId, suggestionId, body.getNote()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("code", ex.getMessage()));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("code", ex.getMessage()));
        }
    }
}
