package ma.nafura.chantiers.api.controller;

import jakarta.validation.Valid;
import java.util.List;
import ma.nafura.chantiers.api.dto.ZoneChantierDto;
import ma.nafura.chantiers.api.request.ZoneChantierCreateDto;
import ma.nafura.chantiers.service.ZoneChantierService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** AC-14 — le référentiel de zones du chantier, vide par défaut. */
@RestController
@RequestMapping("/api/v1/chantiers/{chantierId}/zones")
@SecuredResource(domain = "chantiers", feature = "chantiers", resource = "zone-chantier")
public class ZoneChantierController {

    private final ZoneChantierService service;

    public ZoneChantierController(ZoneChantierService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("chantiers.read")
    public ResponseEntity<List<ZoneChantierDto>> list(@PathVariable String chantierId) {
        return ResponseEntity.ok(service.listByChantier(chantierId));
    }

    @PostMapping
    @RequirePermission("chantiers.create")
    public ResponseEntity<ZoneChantierDto> create(
            @PathVariable String chantierId, @Valid @RequestBody ZoneChantierCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(chantierId, body));
    }

    @DeleteMapping("/{zoneId}")
    @RequirePermission("chantiers.delete")
    public ResponseEntity<Void> delete(@PathVariable String chantierId, @PathVariable String zoneId) {
        service.delete(chantierId, zoneId);
        return ResponseEntity.noContent().build();
    }
}
