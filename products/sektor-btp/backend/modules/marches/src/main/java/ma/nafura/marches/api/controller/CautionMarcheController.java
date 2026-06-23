package ma.nafura.marches.api.controller;

import jakarta.validation.Valid;
import java.util.List;
import ma.nafura.marches.api.dto.CautionRenouvelerDto;
import ma.nafura.marches.api.request.CautionMarcheCreateDto;
import ma.nafura.marches.domain.model.CautionMarche;
import ma.nafura.marches.service.CautionMarcheService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/marches/cautions")
@SecuredResource(domain = "marches", feature = "marches", resource = "caution")
public class CautionMarcheController {

    private final CautionMarcheService service;

    public CautionMarcheController(CautionMarcheService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("marches.caution.read")
    public ResponseEntity<List<CautionMarche>> list(
            @RequestParam(required = false) String contratId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String q) {
        String effectiveSearch = search != null && !search.isBlank() ? search : q;
        return ResponseEntity.ok(service.list(contratId, status, effectiveSearch));
    }

    @GetMapping("/{id}")
    @RequirePermission("marches.caution.read")
    public ResponseEntity<CautionMarche> getById(@PathVariable String id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    @RequirePermission("marches.caution.create")
    public ResponseEntity<CautionMarche> create(@Valid @RequestBody CautionMarcheCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(body));
    }

    @PostMapping("/{id}/renouveler")
    @RequirePermission("marches.caution.update")
    public ResponseEntity<CautionMarche> renouveler(
            @PathVariable String id, @RequestBody(required = false) CautionRenouvelerDto body) {
        return ResponseEntity.ok(service.renouveler(id, body));
    }

    @PostMapping("/{id}/demander-mainlevee")
    @RequirePermission("marches.caution.update")
    public ResponseEntity<CautionMarche> demanderMainlevee(@PathVariable String id) {
        return ResponseEntity.ok(service.demanderMainlevee(id));
    }

    @PostMapping("/{id}/mainlever")
    @RequirePermission("marches.caution.update")
    public ResponseEntity<CautionMarche> mainlever(@PathVariable String id) {
        return ResponseEntity.ok(service.mainlever(id));
    }

    @GetMapping("/expirant")
    @RequirePermission("marches.caution.read")
    public ResponseEntity<List<CautionMarche>> expirant(@RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(service.expirant(days));
    }
}
