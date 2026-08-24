package ma.nafura.chantiers.api.controller;

import jakarta.validation.Valid;
import java.util.List;
import ma.nafura.chantiers.api.request.CoutReelCreateDto;
import ma.nafura.chantiers.domain.budget.CoutReelNoeud;
import ma.nafura.chantiers.service.ImputationCoutReelService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * L'imputation du réel : un nœud, une rubrique, un montant, une date (AC-10).
 *
 * <p>Aucune activité, aucune zone, aucune quotité n'est requise ni proposée. Un coût envoyé sans
 * nœud tombe sur « Frais de chantier » et reste ré-imputable (AC-11).
 */
@RestController
@RequestMapping("/api/v1/chantiers/{chantierId}/couts-reels")
@SecuredResource(domain = "chantiers", feature = "chantiers", resource = "cout-reel")
public class CoutReelNoeudController {

    private final ImputationCoutReelService service;

    public CoutReelNoeudController(ImputationCoutReelService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("chantiers.read")
    public ResponseEntity<List<CoutReelNoeud>> list(@PathVariable String chantierId) {
        return ResponseEntity.ok(service.listByChantier(chantierId));
    }

    @PostMapping
    @RequirePermission("chantiers.update")
    public ResponseEntity<CoutReelNoeud> imputer(
            @PathVariable String chantierId, @Valid @RequestBody CoutReelCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.imputer(chantierId, body));
    }

    /** AC-11 — remettre une dépense sur le bon nœud après coup. */
    @PutMapping("/{coutId}/noeud/{posteId}")
    @RequirePermission("chantiers.update")
    public ResponseEntity<CoutReelNoeud> reimputer(
            @PathVariable String chantierId,
            @PathVariable String coutId,
            @PathVariable String posteId) {
        return ResponseEntity.ok(service.reimputer(coutId, posteId));
    }
}
