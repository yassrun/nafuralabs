package ma.nafura.etudes.api.controller;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import ma.nafura.etudes.api.request.DossierPlanningActiviteRequest;
import ma.nafura.etudes.api.request.DossierPlanningRessourceRequest;
import ma.nafura.etudes.domain.planning.DossierPlanningActivite;
import ma.nafura.etudes.domain.planning.DossierPlanningRessource;
import ma.nafura.etudes.service.DossierPlanningService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/etudes/dossiers/{dossierId}")
@SecuredResource(domain = "etudes", feature = "etudes", resource = "dossier")
public class DossierPlanningController {

    private final DossierPlanningService service;

    public DossierPlanningController(DossierPlanningService service) {
        this.service = service;
    }

    @GetMapping("/planning-activites")
    @RequirePermission("etude.read")
    public ResponseEntity<List<DossierPlanningActivite>> listerActivites(
            @PathVariable UUID dossierId) {
        return ResponseEntity.ok(service.listerActivites(dossierId));
    }

    @PostMapping("/planning-activites")
    @RequirePermission("etude.update")
    public ResponseEntity<?> creerActivite(
            @PathVariable UUID dossierId, @Valid @RequestBody DossierPlanningActiviteRequest body) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(service.creerActivite(dossierId, body));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("code", ex.getMessage()));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("code", ex.getMessage()));
        }
    }

    @PutMapping("/planning-activites/{activiteId}")
    @RequirePermission("etude.update")
    public ResponseEntity<?> modifierActivite(
            @PathVariable UUID dossierId,
            @PathVariable UUID activiteId,
            @Valid @RequestBody DossierPlanningActiviteRequest body) {
        try {
            return ResponseEntity.ok(service.modifierActivite(dossierId, activiteId, body));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("code", ex.getMessage()));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("code", ex.getMessage()));
        }
    }

    @DeleteMapping("/planning-activites/{activiteId}")
    @RequirePermission("etude.update")
    public ResponseEntity<?> supprimerActivite(
            @PathVariable UUID dossierId, @PathVariable UUID activiteId) {
        try {
            service.supprimerActivite(dossierId, activiteId);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("code", ex.getMessage()));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("code", ex.getMessage()));
        }
    }

    @GetMapping("/planning-ressources")
    @RequirePermission("etude.read")
    public ResponseEntity<List<DossierPlanningRessource>> listerRessources(
            @PathVariable UUID dossierId) {
        return ResponseEntity.ok(service.listerRessources(dossierId));
    }

    @PostMapping("/planning-ressources")
    @RequirePermission("etude.update")
    public ResponseEntity<?> creerRessource(
            @PathVariable UUID dossierId, @Valid @RequestBody DossierPlanningRessourceRequest body) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(service.creerRessource(dossierId, body));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("code", ex.getMessage()));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("code", ex.getMessage()));
        }
    }

    @PutMapping("/planning-ressources/{ressourceId}")
    @RequirePermission("etude.update")
    public ResponseEntity<?> modifierRessource(
            @PathVariable UUID dossierId,
            @PathVariable UUID ressourceId,
            @Valid @RequestBody DossierPlanningRessourceRequest body) {
        try {
            return ResponseEntity.ok(service.modifierRessource(dossierId, ressourceId, body));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("code", ex.getMessage()));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("code", ex.getMessage()));
        }
    }

    @DeleteMapping("/planning-ressources/{ressourceId}")
    @RequirePermission("etude.update")
    public ResponseEntity<?> supprimerRessource(
            @PathVariable UUID dossierId, @PathVariable UUID ressourceId) {
        try {
            service.supprimerRessource(dossierId, ressourceId);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("code", ex.getMessage()));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("code", ex.getMessage()));
        }
    }
}
