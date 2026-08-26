package ma.nafura.chantiers.api.controller;

import ma.nafura.chantiers.api.dto.ChantierPortefeuilleRowDto;
import ma.nafura.chantiers.service.ChantierPortefeuilleService;
import ma.nafura.chantiers.service.ChantierPortefeuilleService.PortefeuilleQuery;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Portefeuille chantier décisionnel (cockpit-chantier AC-18, AC-19) — filtres serveur (statut,
 * sévérité d'alerte, responsable, en retard, marge négative), tris contractuels et pagination
 * stable. Consomme les mêmes agrégats que le cockpit ; aucune vérité dupliquée.
 */
@RestController
@RequestMapping("/api/v1/chantiers/portefeuille")
@SecuredResource(domain = "chantiers", feature = "chantiers", resource = "portefeuille")
public class ChantierPortefeuilleController {

    private final ChantierPortefeuilleService service;

    public ChantierPortefeuilleController(ChantierPortefeuilleService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("read")
    public ResponseEntity<ChantierPortefeuilleRowDto.Page> lister(
            @RequestParam(required = false) String recherche,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String severiteAlerte,
            @RequestParam(required = false) String responsable,
            @RequestParam(required = false) Boolean enRetard,
            @RequestParam(required = false) Boolean margeNegative,
            @RequestParam(required = false, defaultValue = "code") String tri,
            @RequestParam(required = false, defaultValue = "asc") String sens,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "20") int size) {
        PortefeuilleQuery q = new PortefeuilleQuery(
                status, severiteAlerte, responsable, enRetard, margeNegative,
                recherche, tri, sens, Math.max(0, page), Math.min(Math.max(1, size), 100));
        return ResponseEntity.ok(service.lister(q));
    }
}
