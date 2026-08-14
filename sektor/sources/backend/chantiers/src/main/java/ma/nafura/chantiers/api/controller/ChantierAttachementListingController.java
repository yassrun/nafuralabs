package ma.nafura.chantiers.api.controller;

import java.util.List;
import ma.nafura.chantiers.api.dto.AttachementChantierDto;
import ma.nafura.chantiers.service.AttachementChantierService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/chantiers")
@SecuredResource(domain = "chantiers", feature = "chantiers", resource = "attachement-chantier")
public class ChantierAttachementListingController {

    private final AttachementChantierService service;

    public ChantierAttachementListingController(AttachementChantierService service) {
        this.service = service;
    }

    @GetMapping("/attachements")
    @RequirePermission("chantiers.read")
    public ResponseEntity<List<AttachementChantierDto>> listAll() {
        return ResponseEntity.ok(service.listAll());
    }
}
