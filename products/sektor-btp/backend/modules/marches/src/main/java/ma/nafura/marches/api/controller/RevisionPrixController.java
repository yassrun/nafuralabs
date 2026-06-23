package ma.nafura.marches.api.controller;

import jakarta.validation.Valid;
import java.util.List;
import ma.nafura.marches.api.request.RevisionPrixCalculerDto;
import ma.nafura.marches.domain.model.RevisionPrix;
import ma.nafura.marches.service.RevisionPrixService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/marches/revisions-prix")
@SecuredResource(domain = "marches", feature = "marches", resource = "revision-prix")
public class RevisionPrixController {

    private final RevisionPrixService service;

    public RevisionPrixController(RevisionPrixService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("marches.revision-prix.read")
    public ResponseEntity<List<RevisionPrix>> list(@RequestParam(required = false) String contratId) {
        return ResponseEntity.ok(service.list(contratId));
    }

    @PostMapping("/calculer")
    @RequirePermission("marches.revision-prix.update")
    public ResponseEntity<RevisionPrix> calculer(@Valid @RequestBody RevisionPrixCalculerDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.calculer(body));
    }

    @PostMapping("/{id}/appliquer")
    @RequirePermission("marches.revision-prix.update")
    public ResponseEntity<RevisionPrix> appliquer(@PathVariable String id) {
        return ResponseEntity.ok(service.appliquer(id));
    }
}
