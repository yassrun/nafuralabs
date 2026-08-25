package ma.nafura.chantiers.api.controller;

import jakarta.validation.Valid;
import java.util.List;
import ma.nafura.chantiers.api.dto.ActiviteChantierDto;
import ma.nafura.chantiers.api.dto.ActivitePlanningDto;
import ma.nafura.chantiers.api.dto.ActivitePrecedenceDto;
import ma.nafura.chantiers.api.dto.ActiviteRattachementDto;
import ma.nafura.chantiers.api.request.ActiviteAvancementCreateDto;
import ma.nafura.chantiers.api.request.ActiviteChantierCreateDto;
import ma.nafura.chantiers.api.request.ActiviteChantierUpdateDto;
import ma.nafura.chantiers.api.request.ActivitePrecedenceCreateDto;
import ma.nafura.chantiers.api.request.ActiviteRattachementCreateDto;
import ma.nafura.chantiers.service.ActiviteAvancementService;
import ma.nafura.chantiers.service.ActiviteChantierService;
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

/** AC-1..AC-7 — couche d'activités du planning chantier. */
@RestController
@RequestMapping("/api/v1/chantiers/{chantierId}/activites")
@SecuredResource(domain = "chantiers", feature = "chantiers", resource = "chantier-activite")
public class ActiviteChantierController {

    private final ActiviteChantierService service;
    private final ActiviteAvancementService avancementService;

    public ActiviteChantierController(
            ActiviteChantierService service, ActiviteAvancementService avancementService) {
        this.service = service;
        this.avancementService = avancementService;
    }

    @GetMapping
    @RequirePermission("chantiers.read")
    public ResponseEntity<List<ActiviteChantierDto>> list(@PathVariable String chantierId) {
        return ResponseEntity.ok(service.list(chantierId));
    }

    @GetMapping("/planning")
    @RequirePermission("chantiers.read")
    public ResponseEntity<ActivitePlanningDto> planning(@PathVariable String chantierId) {
        return ResponseEntity.ok(service.planning(chantierId));
    }

    @GetMapping("/{activiteId}")
    @RequirePermission("chantiers.read")
    public ResponseEntity<ActiviteChantierDto> get(
            @PathVariable String chantierId, @PathVariable String activiteId) {
        return ResponseEntity.ok(service.get(chantierId, activiteId));
    }

    @PostMapping
    @RequirePermission("chantiers.create")
    public ResponseEntity<ActiviteChantierDto> create(
            @PathVariable String chantierId, @Valid @RequestBody ActiviteChantierCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(chantierId, body));
    }

    @PutMapping("/{activiteId}")
    @RequirePermission("chantiers.update")
    public ResponseEntity<ActiviteChantierDto> update(
            @PathVariable String chantierId,
            @PathVariable String activiteId,
            @RequestBody ActiviteChantierUpdateDto body) {
        return ResponseEntity.ok(service.update(chantierId, activiteId, body));
    }

    @DeleteMapping("/{activiteId}")
    @RequirePermission("chantiers.delete")
    public ResponseEntity<Void> delete(
            @PathVariable String chantierId, @PathVariable String activiteId) {
        service.delete(chantierId, activiteId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{activiteId}/avancements")
    @RequirePermission("chantiers.create")
    public ResponseEntity<Object> declarerAvancement(
            @PathVariable String chantierId,
            @PathVariable String activiteId,
            @Valid @RequestBody ActiviteAvancementCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(avancementService.declarer(chantierId, activiteId, body));
    }

    @PostMapping("/{activiteId}/rattachements")
    @RequirePermission("chantiers.create")
    public ResponseEntity<ActiviteRattachementDto> rattacher(
            @PathVariable String chantierId,
            @PathVariable String activiteId,
            @Valid @RequestBody ActiviteRattachementCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.rattacher(chantierId, activiteId, body));
    }

    @DeleteMapping("/{activiteId}/rattachements/{rattachementId}")
    @RequirePermission("chantiers.delete")
    public ResponseEntity<Void> detacher(
            @PathVariable String chantierId,
            @PathVariable String activiteId,
            @PathVariable String rattachementId) {
        service.detacher(chantierId, activiteId, rattachementId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/precedences")
    @RequirePermission("chantiers.create")
    public ResponseEntity<ActivitePrecedenceDto> lier(
            @PathVariable String chantierId, @Valid @RequestBody ActivitePrecedenceCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.lier(chantierId, body));
    }

    @DeleteMapping("/precedences/{precedenceId}")
    @RequirePermission("chantiers.delete")
    public ResponseEntity<Void> delier(
            @PathVariable String chantierId, @PathVariable String precedenceId) {
        service.delier(chantierId, precedenceId);
        return ResponseEntity.noContent().build();
    }
}
