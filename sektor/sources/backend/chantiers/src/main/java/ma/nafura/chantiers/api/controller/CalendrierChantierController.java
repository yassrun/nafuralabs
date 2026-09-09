package ma.nafura.chantiers.api.controller;

import jakarta.validation.Valid;
import java.util.Optional;
import ma.nafura.chantiers.api.dto.CalendrierChantierDto;
import ma.nafura.chantiers.api.request.CalendrierVersionWriteDto;
import ma.nafura.chantiers.service.CalendrierChantierService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * CRUD calendrier du chantier (SEKTOR-326). GET ne crée pas (paresseux à l'écriture).
 * PUT / POST version ≠ recalcul de masse ; pas de simulation L2.
 */
@RestController
@RequestMapping("/api/v1/chantiers/{chantierId}/calendrier")
@SecuredResource(domain = "chantiers", feature = "chantiers", resource = "chantier-calendrier")
public class CalendrierChantierController {

    private final CalendrierChantierService service;

    public CalendrierChantierController(CalendrierChantierService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("chantiers.read")
    public ResponseEntity<CalendrierChantierDto> get(@PathVariable String chantierId) {
        Optional<CalendrierChantierDto> found = service.find(chantierId);
        return found.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    public record PreviewRequest(
            @jakarta.validation.constraints.NotNull java.time.LocalDate dateDebut,
            @jakarta.validation.constraints.Min(1) int dureeMinutesOuvrees,
            ma.nafura.chantiers.domain.calendrier.CalendrierActivite calendrierSpecifique) {}
    public record PreviewResponse(java.time.LocalDate dateFin) {}

    @PostMapping("/preview")
    @RequirePermission("chantiers.read")
    public ResponseEntity<PreviewResponse> preview(
            @PathVariable String chantierId, @Valid @RequestBody PreviewRequest body) {
        return ResponseEntity.ok(new PreviewResponse(service.previewFin(chantierId, body.dateDebut(), body.dureeMinutesOuvrees(), body.calendrierSpecifique())));
    }

    @PutMapping
    @RequirePermission("chantiers.update")
    public ResponseEntity<CalendrierChantierDto> upsert(
            @PathVariable String chantierId, @Valid @RequestBody CalendrierVersionWriteDto body) {
        return ResponseEntity.ok(service.upsert(chantierId, body));
    }

    @PostMapping("/versions")
    @RequirePermission("chantiers.update")
    public ResponseEntity<CalendrierChantierDto> addVersion(
            @PathVariable String chantierId, @Valid @RequestBody CalendrierVersionWriteDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.addVersion(chantierId, body));
    }

    @DeleteMapping("/versions/{versionId}")
    @RequirePermission("chantiers.update")
    public ResponseEntity<Void> deleteVersion(
            @PathVariable String chantierId, @PathVariable String versionId) {
        service.deleteVersion(chantierId, versionId);
        return ResponseEntity.noContent().build();
    }
}
