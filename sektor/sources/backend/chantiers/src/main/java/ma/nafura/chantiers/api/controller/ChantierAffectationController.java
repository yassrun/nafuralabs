package ma.nafura.chantiers.api.controller;

import jakarta.validation.Valid;
import java.util.List;
import ma.nafura.chantiers.api.dto.ChantierAffectationDto;
import ma.nafura.chantiers.api.request.ChantierAffectationCreateDto;
import ma.nafura.chantiers.api.request.ChantierAffectationUpdateDto;
import ma.nafura.chantiers.service.ChantierAffectationService;
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
@RequestMapping("/api/v1/chantiers/{chantierId}/affectations")
@SecuredResource(domain = "chantiers", feature = "affectations", resource = "affectation")
public class ChantierAffectationController {

    private final ChantierAffectationService service;

    public ChantierAffectationController(ChantierAffectationService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission(value = "chantiers.chantiers.chantier.read", fullPermission = true)
    public ResponseEntity<List<ChantierAffectationDto>> list(@PathVariable String chantierId) {
        return ResponseEntity.ok(service.listByChantier(chantierId));
    }

    @GetMapping("/roles")
    @RequirePermission(value = "chantiers.chantiers.chantier.read", fullPermission = true)
    public ResponseEntity<List<String>> affectableRoles(@PathVariable String chantierId) {
        return ResponseEntity.ok(service.assignableRoles(chantierId));
    }

    @PostMapping
    @RequirePermission(value = "chantiers.chantiers.chantier.update", fullPermission = true)
    public ResponseEntity<ChantierAffectationDto> create(
            @PathVariable String chantierId, @Valid @RequestBody ChantierAffectationCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(chantierId, body));
    }

    @PutMapping("/{affectationId}")
    @RequirePermission(value = "chantiers.chantiers.chantier.update", fullPermission = true)
    public ResponseEntity<ChantierAffectationDto> update(
            @PathVariable String chantierId,
            @PathVariable String affectationId,
            @RequestBody ChantierAffectationUpdateDto body) {
        return ResponseEntity.ok(service.update(chantierId, affectationId, body));
    }

    @DeleteMapping("/{affectationId}")
    @RequirePermission(value = "chantiers.chantiers.chantier.update", fullPermission = true)
    public ResponseEntity<Void> deactivate(
            @PathVariable String chantierId, @PathVariable String affectationId) {
        service.deactivate(chantierId, affectationId);
        return ResponseEntity.noContent().build();
    }
}
