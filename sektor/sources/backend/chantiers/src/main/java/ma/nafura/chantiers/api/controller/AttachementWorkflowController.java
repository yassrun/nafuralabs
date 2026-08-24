package ma.nafura.chantiers.api.controller;

import jakarta.validation.Valid;
import ma.nafura.chantiers.api.dto.AttachementChantierDto;
import ma.nafura.chantiers.api.dto.LienSignatureDto;
import ma.nafura.chantiers.api.request.AttachementLigneZoneUpdateDto;
import ma.nafura.chantiers.service.AttachementChantierService;
import ma.nafura.chantiers.service.AttachementSignatureService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/attachements")
@SecuredResource(domain = "chantiers", feature = "chantiers", resource = "attachement-chantier")
public class AttachementWorkflowController {

    private final AttachementChantierService service;
    private final AttachementSignatureService signatureService;

    public AttachementWorkflowController(
            AttachementChantierService service, AttachementSignatureService signatureService) {
        this.service = service;
        this.signatureService = signatureService;
    }

    /** AC-19 — le jeton, rendu une seule fois ; seul son hash est conservé. */
    @PostMapping("/{id}/lien-signature")
    @RequirePermission("chantiers.update")
    public ResponseEntity<LienSignatureDto> genererLienSignature(@PathVariable String id) {
        return ResponseEntity.status(HttpStatus.CREATED).body(signatureService.genererLien(id));
    }

    @PostMapping("/{id}/soumettre-signature")
    @RequirePermission("chantiers.update")
    public ResponseEntity<AttachementChantierDto> soumettreSignature(@PathVariable String id) {
        return ResponseEntity.ok(service.soumettreSignature(id));
    }

    /** AC-17 — retour en brouillon + remontage depuis les déclarations. */
    @PostMapping("/{id}/contester")
    @RequirePermission("chantiers.update")
    public ResponseEntity<AttachementChantierDto> contester(@PathVariable String id) {
        return ResponseEntity.ok(service.contester(id));
    }

    /** AC-14 — la zone facultative d'une ligne, choisie dans le référentiel du chantier. */
    @PutMapping("/{id}/lignes/{ligneId}/zone")
    @RequirePermission("chantiers.update")
    public ResponseEntity<AttachementChantierDto> assignerZone(
            @PathVariable String id,
            @PathVariable String ligneId,
            @Valid @RequestBody AttachementLigneZoneUpdateDto body) {
        return ResponseEntity.ok(service.assignerZone(id, ligneId, body.getZoneId()));
    }
}
