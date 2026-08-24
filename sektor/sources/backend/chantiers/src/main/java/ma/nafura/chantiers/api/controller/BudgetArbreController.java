package ma.nafura.chantiers.api.controller;

import ma.nafura.chantiers.api.dto.BudgetArbreDto;
import ma.nafura.chantiers.service.BudgetArbreService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Le budget lu sur l'arbre : déboursé, marge et écart au poste, au lot et au chantier.
 *
 * <p>Lecture seule, et pour cause : rien ici n'est stocké (AC-8, AC-9). Les écritures se font
 * sur le nœud — déboursé (AC-6, AC-7) ou coût réel (AC-10).
 */
@RestController
@RequestMapping("/api/v1/chantiers/{chantierId}/budget-arbre")
@SecuredResource(domain = "chantiers", feature = "chantiers", resource = "budget-chantier")
public class BudgetArbreController {

    private final BudgetArbreService service;

    public BudgetArbreController(BudgetArbreService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("chantiers.read")
    public ResponseEntity<BudgetArbreDto> lire(@PathVariable String chantierId) {
        return ResponseEntity.ok(service.lireArbre(chantierId));
    }
}
