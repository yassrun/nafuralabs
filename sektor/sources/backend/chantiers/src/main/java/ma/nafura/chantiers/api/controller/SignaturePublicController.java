package ma.nafura.chantiers.api.controller;

import jakarta.validation.Valid;
import java.util.Map;
import ma.nafura.chantiers.api.dto.AttachementChantierDto;
import ma.nafura.chantiers.api.dto.SignAttachementInfoDto;
import ma.nafura.chantiers.api.request.SignSubmitDto;
import ma.nafura.chantiers.service.AttachementSignatureService;
import ma.nafura.chantiers.service.SignatureTokenInvalideException;
import ma.nafura.platform.authorization.security.authorization.PublicEndpoint;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * AC-19 — le jeton est un secret aléatoire, distinct de l'identifiant de l'attachement
 * ({@link AttachementSignatureService}). Un jeton inconnu, expiré ou déjà consommé rend ici le
 * même 404, sans jamais dire lequel des trois — ni si l'attachement existe.
 */
@RestController
@RequestMapping("/api/v1/sign")
public class SignaturePublicController {

    private final AttachementSignatureService signatureService;

    public SignaturePublicController(AttachementSignatureService signatureService) {
        this.signatureService = signatureService;
    }

    @GetMapping("/{token}")
    @PublicEndpoint(reason = "E-signature page without login — token is a random secret, not the attachement id")
    public ResponseEntity<SignAttachementInfoDto> get(@PathVariable String token) {
        return ResponseEntity.ok(signatureService.getSignInfo(token));
    }

    @PostMapping("/{token}")
    @PublicEndpoint(reason = "Submit e-signature canvas without login")
    public ResponseEntity<AttachementChantierDto> submit(
            @PathVariable String token, @Valid @RequestBody SignSubmitDto body) {
        return ResponseEntity.ok(signatureService.submitSignature(token, body));
    }

    @ExceptionHandler(SignatureTokenInvalideException.class)
    public ResponseEntity<Map<String, String>> onInvalidToken() {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("code", "chantiers.signature.jeton_invalide"));
    }
}
