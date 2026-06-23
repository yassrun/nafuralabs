package ma.nafura.chantiers.api.controller;

import ma.nafura.chantiers.api.dto.AttachementChantierDto;
import ma.nafura.chantiers.service.AttachementChantierService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/attachements")
@SecuredResource(domain = "chantiers", feature = "chantiers", resource = "attachement-chantier")
public class AttachementWorkflowController {

    private final AttachementChantierService service;

    public AttachementWorkflowController(AttachementChantierService service) {
        this.service = service;
    }

    @PostMapping("/{id}/soumettre-signature")
    @RequirePermission("chantiers.update")
    public ResponseEntity<AttachementChantierDto> soumettreSignature(@PathVariable String id) {
        return ResponseEntity.ok(service.soumettreSignature(id));
    }
}
