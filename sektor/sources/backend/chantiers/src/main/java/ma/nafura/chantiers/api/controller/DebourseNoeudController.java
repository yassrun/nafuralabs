package ma.nafura.chantiers.api.controller;

import jakarta.validation.Valid;
import ma.nafura.chantiers.api.dto.DebourseNoeudDto;
import ma.nafura.chantiers.api.request.DebourseNoeudSaisieDto;
import ma.nafura.chantiers.service.DebourseNoeudService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Le déboursé se lit et se saisit <b>sur le nœud</b> — plus au chantier (AC-7, AC-8).
 *
 * <p>Deux écritures distinctes parce que ce ne sont pas les mêmes gestes : poser le déboursé
 * d'un nœud interne, et corriger celui d'un nœud dont le prévu est une copie intouchable.
 */
@RestController
@RequestMapping("/api/v1/postes-budgetaires/{posteId}/debourse")
@SecuredResource(domain = "chantiers", feature = "chantiers", resource = "debourse-noeud")
public class DebourseNoeudController {

    private final DebourseNoeudService service;

    public DebourseNoeudController(DebourseNoeudService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("chantiers.read")
    public ResponseEntity<DebourseNoeudDto> lire(@PathVariable String posteId) {
        return ResponseEntity.ok(service.lire(posteId));
    }

    /** AC-6 — un nœud interne n'a pas de DPU derrière lui : son déboursé se saisit. */
    @PutMapping
    @RequirePermission("chantiers.update")
    public ResponseEntity<DebourseNoeudDto> saisir(
            @PathVariable String posteId, @Valid @RequestBody DebourseNoeudSaisieDto body) {
        return ResponseEntity.ok(service.saisirSurNoeudInterne(posteId, body));
    }

    /** AC-7 — corriger ne réécrit pas la copie : le révisé se pose à côté du prévu. */
    @PutMapping("/revision")
    @RequirePermission("chantiers.update")
    public ResponseEntity<DebourseNoeudDto> reviser(
            @PathVariable String posteId, @Valid @RequestBody DebourseNoeudSaisieDto body) {
        return ResponseEntity.ok(service.reviser(posteId, body));
    }
}
