package ma.nafura.chantiers.api.controller;

import jakarta.validation.Valid;
import ma.nafura.chantiers.api.dto.AttachementChantierDto;
import ma.nafura.chantiers.api.dto.SignAttachementInfoDto;
import ma.nafura.chantiers.api.request.SignSubmitDto;
import ma.nafura.chantiers.service.AttachementSignatureService;
import ma.nafura.platform.authorization.security.authorization.PublicEndpoint;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/sign")
public class SignaturePublicController {

    private final AttachementSignatureService signatureService;

    public SignaturePublicController(AttachementSignatureService signatureService) {
        this.signatureService = signatureService;
    }

    @GetMapping("/{token}")
    @PublicEndpoint(reason = "E-signature page without login (stub token = attachement id)")
    public ResponseEntity<SignAttachementInfoDto> get(@PathVariable String token) {
        return ResponseEntity.ok(signatureService.getSignInfo(token));
    }

    @PostMapping("/{token}")
    @PublicEndpoint(reason = "Submit e-signature canvas without login")
    public ResponseEntity<AttachementChantierDto> submit(
            @PathVariable String token, @Valid @RequestBody SignSubmitDto body) {
        return ResponseEntity.ok(signatureService.submitSignature(token, body));
    }
}
