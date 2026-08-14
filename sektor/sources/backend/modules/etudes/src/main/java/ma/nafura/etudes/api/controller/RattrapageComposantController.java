package ma.nafura.etudes.api.controller;

import jakarta.validation.Valid;
import java.util.Map;
import java.util.UUID;
import ma.nafura.etudes.api.dto.RattrapageResumeDto;
import ma.nafura.etudes.api.request.RattrapageCreerDto;
import ma.nafura.etudes.api.request.RattrapageIgnorerDto;
import ma.nafura.etudes.api.request.RattrapageRapprocherDto;
import ma.nafura.etudes.service.RattrapageComposantService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/etudes/dossiers/{dossierId}/rattrapage")
@SecuredResource(domain = "etudes", feature = "etudes", resource = "dossier")
public class RattrapageComposantController {

    private final RattrapageComposantService service;

    public RattrapageComposantController(RattrapageComposantService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("etude.read")
    public ResponseEntity<RattrapageResumeDto> resume(@PathVariable UUID dossierId) {
        return ResponseEntity.ok(service.resume(dossierId));
    }

    @PostMapping("/ignorer")
    @RequirePermission("etude.update")
    public ResponseEntity<?> ignorer(
            @PathVariable UUID dossierId, @Valid @RequestBody RattrapageIgnorerDto body) {
        try {
            int n = service.ignorer(dossierId, body);
            return ResponseEntity.ok(Map.of("updated", n));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("code", ex.getMessage()));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("code", ex.getMessage()));
        }
    }

    @PostMapping("/rapprocher")
    @RequirePermission("etude.update")
    public ResponseEntity<?> rapprocher(
            @PathVariable UUID dossierId, @Valid @RequestBody RattrapageRapprocherDto body) {
        try {
            int n = service.rapprocher(dossierId, body);
            return ResponseEntity.ok(Map.of("updated", n));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("code", ex.getMessage()));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("code", ex.getMessage()));
        }
    }

    @PostMapping("/creer")
    @RequirePermission("etude.update")
    public ResponseEntity<?> creer(
            @PathVariable UUID dossierId, @Valid @RequestBody RattrapageCreerDto body) {
        try {
            Object result = service.creerOuDemander(dossierId, body);
            return ResponseEntity.status(HttpStatus.CREATED).body(result);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("code", ex.getMessage()));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("code", ex.getMessage()));
        }
    }
}
