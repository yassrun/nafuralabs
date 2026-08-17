package ma.nafura.etudes.api.controller;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import ma.nafura.etudes.api.dto.GuestSnapshotDto;
import ma.nafura.etudes.api.dto.GuestSnapshotDto.GuestCommentDto;
import ma.nafura.etudes.domain.dossier.DossierDocument;
import ma.nafura.etudes.service.guest.GuestAccessService;
import ma.nafura.etudes.service.guest.GuestLinkInactiveException;
import ma.nafura.etudes.service.guest.GuestLinkPurposeException;
import ma.nafura.platform.authorization.security.authorization.PublicEndpoint;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/public/guest-links")
public class GuestAccessPublicController {

    private final GuestAccessService service;

    public GuestAccessPublicController(GuestAccessService service) {
        this.service = service;
    }

    @GetMapping("/{token}")
    @PublicEndpoint(reason = "Guest dossier snapshot by email token, no login")
    public ResponseEntity<GuestSnapshotDto> resolve(@PathVariable String token) {
        return ResponseEntity.ok(service.resolve(token));
    }

    @PostMapping(path = "/{token}/devis", consumes = "multipart/form-data")
    @PublicEndpoint(reason = "Supplier devis upload by email token, no login")
    public ResponseEntity<DossierDocument> deposerDevis(
            @PathVariable String token, @RequestParam("file") MultipartFile file) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.deposerDevis(token, file));
    }

    @GetMapping("/{token}/comments")
    @PublicEndpoint(reason = "Guest reads poste comments by email token")
    public ResponseEntity<List<GuestCommentDto>> listComments(
            @PathVariable String token, @RequestParam UUID noeudId) {
        return ResponseEntity.ok(service.listComments(token, noeudId));
    }

    @PostMapping("/{token}/comments")
    @PublicEndpoint(reason = "Guest adds a poste comment by email token")
    public ResponseEntity<GuestCommentDto> addComment(
            @PathVariable String token, @RequestBody Map<String, String> body) {
        UUID noeudId = UUID.fromString(body.getOrDefault("noeudId", ""));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.addComment(token, noeudId, body.get("text")));
    }

    @ExceptionHandler(GuestLinkInactiveException.class)
    public ResponseEntity<Map<String, String>> onInactive() {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("code", "etudes.guest.lien_inactif"));
    }

    @ExceptionHandler(GuestLinkPurposeException.class)
    public ResponseEntity<Map<String, String>> onPurpose() {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("code", "etudes.guest.usage_invalide"));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> onBadRequest(IllegalArgumentException ex) {
        return ResponseEntity.badRequest()
                .body(Map.of("code", ex.getMessage() != null ? ex.getMessage() : "etudes.guest.erreur"));
    }
}
