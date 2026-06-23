package ma.nafura.chantiers.api.controller;

import jakarta.validation.Valid;
import java.util.List;
import ma.nafura.chantiers.api.request.ChantierPhaseCreateDto;
import ma.nafura.chantiers.domain.model.ChantierPhase;
import ma.nafura.chantiers.service.ChantierPhaseService;
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
@RequestMapping("/api/v1/chantiers/{chantierId}/phases")
@SecuredResource(domain = "chantiers", feature = "chantiers", resource = "chantier-phase")
public class ChantierPhaseController {

    private final ChantierPhaseService service;

    public ChantierPhaseController(ChantierPhaseService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("chantiers.read")
    public ResponseEntity<List<ChantierPhase>> list(@PathVariable String chantierId) {
        return ResponseEntity.ok(service.listByChantier(chantierId));
    }

    @PostMapping
    @RequirePermission("chantiers.create")
    public ResponseEntity<ChantierPhase> create(
            @PathVariable String chantierId, @Valid @RequestBody ChantierPhaseCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(chantierId, body));
    }
}
