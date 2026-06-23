package ma.nafura.chantiers.api.controller;

import java.util.List;
import ma.nafura.chantiers.api.dto.DocumentChantierDto;
import ma.nafura.chantiers.service.DocumentChantierService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/chantiers")
@SecuredResource(domain = "chantiers", feature = "chantiers", resource = "document-chantier")
public class ChantierDocumentListingController {

    private final DocumentChantierService service;

    public ChantierDocumentListingController(DocumentChantierService service) {
        this.service = service;
    }

    @GetMapping("/documents")
    @RequirePermission("chantiers.read")
    public ResponseEntity<List<DocumentChantierDto>> listAll() {
        return ResponseEntity.ok(service.listAll());
    }
}
