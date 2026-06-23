package ma.nafura.marches.api.controller;

import jakarta.validation.Valid;
import java.util.List;
import ma.nafura.marches.api.request.OrdreServiceMarcheCreateDto;
import ma.nafura.marches.domain.model.OrdreServiceMarche;
import ma.nafura.marches.service.OrdreServiceMarcheService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/marches/os")
@SecuredResource(domain = "marches", feature = "marches", resource = "os")
public class OrdreServiceMarcheController {

    private final OrdreServiceMarcheService service;

    public OrdreServiceMarcheController(OrdreServiceMarcheService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("marches.os.read")
    public ResponseEntity<List<OrdreServiceMarche>> list(@RequestParam(required = false) String contratId) {
        return ResponseEntity.ok(service.list(contratId));
    }

    @PostMapping
    @RequirePermission("marches.os.create")
    public ResponseEntity<OrdreServiceMarche> create(@Valid @RequestBody OrdreServiceMarcheCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(body));
    }

    @PostMapping("/{id}/notifier")
    @RequirePermission("marches.os.update")
    public ResponseEntity<OrdreServiceMarche> notifier(@PathVariable String id) {
        return ResponseEntity.ok(service.notifier(id));
    }

    @GetMapping("/{id}/pdf")
    @RequirePermission("marches.os.read")
    public ResponseEntity<Void> pdf(@PathVariable String id) {
        service.getById(id);
        return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).build();
    }
}
