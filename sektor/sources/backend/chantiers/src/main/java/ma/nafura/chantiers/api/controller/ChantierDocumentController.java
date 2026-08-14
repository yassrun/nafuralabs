package ma.nafura.chantiers.api.controller;

import jakarta.validation.Valid;
import java.util.List;
import ma.nafura.chantiers.api.dto.DocumentChantierDto;
import ma.nafura.chantiers.api.request.DocumentChantierCreateDto;
import ma.nafura.chantiers.api.request.DocumentChantierUpdateDto;
import ma.nafura.chantiers.service.DocumentChantierService;
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

@RestController
@RequestMapping("/api/v1/chantiers/{chantierId}/documents")
@SecuredResource(domain = "chantiers", feature = "chantiers", resource = "document-chantier")
public class ChantierDocumentController {

    private final DocumentChantierService service;

    public ChantierDocumentController(DocumentChantierService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("chantiers.read")
    public ResponseEntity<List<DocumentChantierDto>> list(@PathVariable String chantierId) {
        return ResponseEntity.ok(service.listByChantier(chantierId));
    }

    @PostMapping
    @RequirePermission("chantiers.create")
    public ResponseEntity<DocumentChantierDto> create(
            @PathVariable String chantierId, @Valid @RequestBody DocumentChantierCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(chantierId, body));
    }

    @PutMapping("/{id}")
    @RequirePermission("chantiers.update")
    public ResponseEntity<DocumentChantierDto> update(
            @PathVariable String chantierId,
            @PathVariable String id,
            @Valid @RequestBody DocumentChantierUpdateDto body) {
        return ResponseEntity.ok(service.update(chantierId, id, body));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("chantiers.delete")
    public ResponseEntity<Void> delete(@PathVariable String chantierId, @PathVariable String id) {
        service.delete(chantierId, id);
        return ResponseEntity.noContent().build();
    }
}
