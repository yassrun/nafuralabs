package ma.nafura.etudes.api.controller;

import jakarta.validation.Valid;
import java.util.Map;
import java.util.UUID;
import ma.nafura.etudes.api.dto.ConsultationEtudeDto;
import ma.nafura.etudes.api.request.ConsultationEtudeOpenDto;
import ma.nafura.etudes.api.request.ConsultationIdentifierDto;
import ma.nafura.etudes.api.request.ConsultationInviteDto;
import ma.nafura.etudes.api.request.ConsultationPaquetDto;
import ma.nafura.etudes.api.request.DevisConsultationCreateDto;
import ma.nafura.etudes.service.ConsultationEtudeService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/etudes/dossiers/{dossierId}/consultation")
@SecuredResource(domain = "etudes", feature = "etudes", resource = "dossier")
public class ConsultationEtudeController {

    private final ConsultationEtudeService service;

    public ConsultationEtudeController(ConsultationEtudeService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("etude.read")
    public ResponseEntity<ConsultationEtudeDto> get(@PathVariable UUID dossierId) {
        return ResponseEntity.ok(service.get(dossierId));
    }

    @PostMapping
    @RequirePermission("etude.update")
    public ResponseEntity<ConsultationEtudeDto> ouvrir(
            @PathVariable UUID dossierId, @RequestBody(required = false) ConsultationEtudeOpenDto body) {
        ConsultationEtudeOpenDto dto = body != null ? body : new ConsultationEtudeOpenDto();
        return ResponseEntity.status(HttpStatus.CREATED).body(service.ouvrir(dossierId, dto));
    }

    @PutMapping("/paquet")
    @RequirePermission("etude.update")
    public ResponseEntity<ConsultationEtudeDto> paquet(
            @PathVariable UUID dossierId, @Valid @RequestBody ConsultationPaquetDto body) {
        return ResponseEntity.ok(service.remplacerPaquet(dossierId, body));
    }

    @PostMapping("/fournisseurs")
    @RequirePermission("etude.update")
    public ResponseEntity<ConsultationEtudeDto> inviter(
            @PathVariable UUID dossierId, @Valid @RequestBody ConsultationInviteDto body) {
        return ResponseEntity.ok(service.inviter(dossierId, body));
    }

    @PostMapping("/devis")
    @RequirePermission("etude.update")
    public ResponseEntity<ConsultationEtudeDto> recevoirDevis(
            @PathVariable UUID dossierId, @Valid @RequestBody DevisConsultationCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.recevoirDevis(dossierId, body));
    }

    @PostMapping("/identifier")
    @RequirePermission("etude.update")
    public ResponseEntity<ConsultationEtudeDto> identifier(
            @PathVariable UUID dossierId, @RequestBody(required = false) ConsultationIdentifierDto body) {
        ConsultationIdentifierDto dto = body != null ? body : new ConsultationIdentifierDto();
        return ResponseEntity.ok(service.identifier(dossierId, dto));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, String>> onConflict(IllegalStateException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("code", ex.getMessage() != null ? ex.getMessage() : "conflict"));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> onBadRequest(IllegalArgumentException ex) {
        String code = ex.getMessage() != null ? ex.getMessage() : "bad_request";
        HttpStatus status = "etudes.consultation.introuvable".equals(code)
                        || "etudes.dossier.introuvable".equals(code)
                ? HttpStatus.NOT_FOUND
                : HttpStatus.BAD_REQUEST;
        return ResponseEntity.status(status).body(Map.of("code", code));
    }
}
