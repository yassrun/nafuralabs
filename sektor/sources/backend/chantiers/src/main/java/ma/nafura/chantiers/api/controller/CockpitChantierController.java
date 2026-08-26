package ma.nafura.chantiers.api.controller;

import ma.nafura.chantiers.api.dto.CockpitChantierDto;
import ma.nafura.chantiers.service.CockpitChantierService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Read model cockpit (cockpit-chantier) — instantané de lecture d'un chantier.
 * Appartient au BC Chantiers (lecture d'un seul chantier, pas de consolidation de portefeuille).
 */
@RestController
@RequestMapping("/api/v1/chantiers/{id}/cockpit")
@SecuredResource(domain = "chantiers", feature = "chantiers", resource = "chantier")
public class CockpitChantierController {

    private final CockpitChantierService service;

    public CockpitChantierController(CockpitChantierService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("read")
    public ResponseEntity<CockpitChantierDto> cockpit(@PathVariable String id) {
        return ResponseEntity.ok(service.lireCockpit(id));
    }
}
