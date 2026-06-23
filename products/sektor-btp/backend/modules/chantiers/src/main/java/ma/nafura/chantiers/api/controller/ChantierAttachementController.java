package ma.nafura.chantiers.api.controller;

import jakarta.validation.Valid;
import java.util.List;
import ma.nafura.chantiers.api.dto.AttachementChantierDto;
import ma.nafura.chantiers.api.request.AttachementChantierCreateDto;
import ma.nafura.chantiers.service.AttachementChantierService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/chantiers/{chantierId}/attachements")
@SecuredResource(domain = "chantiers", feature = "chantiers", resource = "attachement-chantier")
public class ChantierAttachementController {

    private final AttachementChantierService service;

    public ChantierAttachementController(AttachementChantierService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("chantiers.read")
    public ResponseEntity<List<AttachementChantierDto>> list(@PathVariable String chantierId) {
        return ResponseEntity.ok(service.listByChantier(chantierId));
    }

    @PostMapping
    @RequirePermission("chantiers.create")
    public ResponseEntity<AttachementChantierDto> create(
            @PathVariable String chantierId, @Valid @RequestBody AttachementChantierCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(chantierId, body));
    }
}
