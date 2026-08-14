package ma.nafura.ventes.api.controller;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import ma.nafura.ventes.api.dto.RetenueGarantieSyntheseDto;
import ma.nafura.ventes.domain.model.RetenueGarantie;
import ma.nafura.ventes.service.RetenueGarantieService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/retenues-garantie")
@SecuredResource(domain = "ventes", feature = "ventes", resource = "retenues-garantie")
public class RetenueGarantieController {

    private final RetenueGarantieService service;

    public RetenueGarantieController(RetenueGarantieService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("ventes.retenues-garantie.read")
    public ResponseEntity<List<RetenueGarantie>> list(
            @RequestParam(required = false) String marcheId,
            @RequestParam(required = false) String statut,
            @RequestParam(required = false) String clientId) {
        return ResponseEntity.ok(service.list(marcheId, statut, clientId));
    }

    @GetMapping("/synthese")
    @RequirePermission("ventes.retenues-garantie.read")
    public ResponseEntity<RetenueGarantieSyntheseDto> synthese(
            @RequestParam(required = false) String clientId) {
        return ResponseEntity.ok(service.synthese(clientId));
    }

    @GetMapping("/{id}")
    @RequirePermission("ventes.retenues-garantie.read")
    public ResponseEntity<RetenueGarantie> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping("/{id}/demande-restitution")
    @RequirePermission("ventes.retenues-garantie.update")
    public ResponseEntity<RetenueGarantie> demandeRestitution(@PathVariable UUID id) {
        return ResponseEntity.ok(service.demandeRestitution(id));
    }

    @PostMapping("/{id}/restituer")
    @RequirePermission("ventes.retenues-garantie.update")
    public ResponseEntity<RetenueGarantie> restituer(
            @PathVariable UUID id, @RequestParam BigDecimal montant) {
        return ResponseEntity.ok(service.restituer(id, montant));
    }
}
