package ma.nafura.marches.api.controller;

import jakarta.validation.Valid;
import java.util.List;
import ma.nafura.marches.api.request.PenaliteMarcheCreateDto;
import ma.nafura.marches.domain.model.PenaliteMarche;
import ma.nafura.marches.service.PenaliteMarcheService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/marches/penalites")
@SecuredResource(domain = "marches", feature = "marches", resource = "penalite")
public class PenaliteMarcheController {

    private final PenaliteMarcheService service;

    public PenaliteMarcheController(PenaliteMarcheService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("marches.penalite.read")
    public ResponseEntity<List<PenaliteMarche>> list(@RequestParam(required = false) String contratId) {
        return ResponseEntity.ok(service.list(contratId));
    }

    @PostMapping
    @RequirePermission("marches.penalite.create")
    public ResponseEntity<PenaliteMarche> create(@Valid @RequestBody PenaliteMarcheCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(body));
    }

    @PostMapping("/{id}/valider")
    @RequirePermission("marches.penalite.update")
    public ResponseEntity<PenaliteMarche> valider(@PathVariable String id) {
        return ResponseEntity.ok(service.valider(id));
    }
}
