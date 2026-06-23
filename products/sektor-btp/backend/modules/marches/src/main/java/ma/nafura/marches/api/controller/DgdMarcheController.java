package ma.nafura.marches.api.controller;

import java.util.List;
import ma.nafura.marches.domain.model.DgdMarche;
import ma.nafura.marches.service.DgdMarcheService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/marches")
@SecuredResource(domain = "marches", feature = "marches", resource = "dgd")
public class DgdMarcheController {

    private final DgdMarcheService service;

    public DgdMarcheController(DgdMarcheService service) {
        this.service = service;
    }

    @GetMapping("/dgd")
    @RequirePermission("marches.dgd.read")
    public ResponseEntity<List<DgdMarche>> list(
            @RequestParam(required = false) String contratId,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(service.list(contratId, status));
    }

    @GetMapping("/dgd/{id}")
    @RequirePermission("marches.dgd.read")
    public ResponseEntity<DgdMarche> getById(@PathVariable String id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping("/contrats/{id}/dgd/generate")
    @RequirePermission("marches.dgd.create")
    public ResponseEntity<DgdMarche> generate(@PathVariable String id) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.generateFromContrat(id));
    }

    @PostMapping("/dgd/{id}/soumettre-moa")
    @RequirePermission("marches.dgd.update")
    public ResponseEntity<DgdMarche> soumettreMoa(@PathVariable String id) {
        return ResponseEntity.ok(service.soumettreMoa(id));
    }

    @PostMapping("/dgd/{id}/notifier")
    @RequirePermission("marches.dgd.update")
    public ResponseEntity<DgdMarche> notifier(@PathVariable String id) {
        return ResponseEntity.ok(service.notifier(id));
    }

    @PostMapping("/dgd/{id}/marquer-paye")
    @RequirePermission("marches.dgd.update")
    public ResponseEntity<DgdMarche> marquerPaye(@PathVariable String id) {
        return ResponseEntity.ok(service.marquerPaye(id));
    }

    @GetMapping("/dgd/{id}/pdf")
    @RequirePermission("marches.dgd.read")
    public ResponseEntity<Void> pdf(@PathVariable String id) {
        service.getById(id);
        return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).build();
    }
}
