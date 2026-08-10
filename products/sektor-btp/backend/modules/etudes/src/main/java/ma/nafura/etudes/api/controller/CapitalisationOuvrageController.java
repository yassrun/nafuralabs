package ma.nafura.etudes.api.controller;

import jakarta.validation.Valid;
import java.util.Map;
import java.util.UUID;
import ma.nafura.etudes.api.dto.CapitalisationResumeDto;
import ma.nafura.etudes.api.dto.CapitalisationVersementResultDto;
import ma.nafura.etudes.api.request.CapitalisationVerserDto;
import ma.nafura.etudes.service.CapitalisationOuvrageService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/etudes/dossiers/{dossierId}/capitalisation")
@SecuredResource(domain = "etudes", feature = "etudes", resource = "dossier")
public class CapitalisationOuvrageController {

    private final CapitalisationOuvrageService service;

    public CapitalisationOuvrageController(CapitalisationOuvrageService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("etude.read")
    public ResponseEntity<CapitalisationResumeDto> resume(@PathVariable UUID dossierId) {
        return ResponseEntity.ok(service.resume(dossierId));
    }

    @PostMapping("/verser")
    @RequirePermission("etude.update")
    public ResponseEntity<?> verser(
            @PathVariable UUID dossierId, @Valid @RequestBody CapitalisationVerserDto body) {
        try {
            CapitalisationVersementResultDto result = service.verser(dossierId, body);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("code", ex.getMessage()));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("code", ex.getMessage()));
        }
    }
}
