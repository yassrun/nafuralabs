package ma.nafura.etudes.api.controller;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import ma.nafura.etudes.api.dto.AvisExecutionResumeDto;
import ma.nafura.etudes.api.request.AvisExecutionCreateDto;
import ma.nafura.etudes.api.request.AvisExecutionTraiterDto;
import ma.nafura.etudes.domain.avis.AvisExecution;
import ma.nafura.etudes.service.AvisExecutionService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/etudes/dossiers/{dossierId}/avis")
@SecuredResource(domain = "etudes", feature = "etudes", resource = "dossier")
public class AvisExecutionController {

    private final AvisExecutionService service;

    public AvisExecutionController(AvisExecutionService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("etude.read")
    public ResponseEntity<List<AvisExecution>> lister(
            @PathVariable UUID dossierId, @RequestParam(required = false) UUID noeudId) {
        return ResponseEntity.ok(service.lister(dossierId, noeudId));
    }

    @GetMapping("/resume")
    @RequirePermission("etude.read")
    public ResponseEntity<AvisExecutionResumeDto> resume(@PathVariable UUID dossierId) {
        return ResponseEntity.ok(service.resume(dossierId));
    }

    @PostMapping
    @RequirePermission("etude.avis")
    public ResponseEntity<?> creer(
            @PathVariable UUID dossierId, @Valid @RequestBody AvisExecutionCreateDto body) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(service.creer(dossierId, body));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("code", ex.getMessage()));
        }
    }

    @PostMapping("/{avisId}/traiter")
    @RequirePermission("etude.update")
    public ResponseEntity<?> traiter(
            @PathVariable UUID dossierId,
            @PathVariable UUID avisId,
            @Valid @RequestBody AvisExecutionTraiterDto body) {
        try {
            return ResponseEntity.ok(service.traiter(dossierId, avisId, body));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("code", ex.getMessage()));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("code", ex.getMessage()));
        }
    }
}
