package ma.nafura.chantiers.api.controller;

import jakarta.validation.Valid;
import ma.nafura.chantiers.api.request.LigneBdpCreateDto;
import ma.nafura.chantiers.api.request.LigneBdpUpdateDto;
import ma.nafura.chantiers.domain.budget.PosteBudgetaire;
import ma.nafura.chantiers.service.ChantierBdpService;
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

/**
 * BDP chiffré du chantier : lecture du bordereau et de ses manques, puis chiffrage ligne par ligne.
 *
 * <p>Ces routes sont la seule voie d'écriture de lignes vendues hors copie d'étude. La saisie
 * générique de l'arbre ({@code /lots}, {@code /lots/{id}/postes-budgetaires}) reste stricte : elle
 * ne produit que de l'interne, sans prix de vente.
 */
@RestController
@RequestMapping("/api/v1/chantiers/{chantierId}/bdp")
@SecuredResource(domain = "chantiers", feature = "chantiers", resource = "chantier-bdp")
public class ChantierBdpController {

    private final ChantierBdpService service;

    public ChantierBdpController(ChantierBdpService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("chantiers.read")
    public ResponseEntity<ChantierBdpService.Bdp> lire(@PathVariable String chantierId) {
        return ResponseEntity.ok(service.lire(chantierId));
    }

    @PostMapping("/lignes")
    @RequirePermission("chantiers.update")
    public ResponseEntity<PosteBudgetaire> creer(
            @PathVariable String chantierId, @Valid @RequestBody LigneBdpCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.creerLigne(chantierId, body));
    }

    @PutMapping("/lignes/{posteId}")
    @RequirePermission("chantiers.update")
    public ResponseEntity<PosteBudgetaire> maj(
            @PathVariable String chantierId,
            @PathVariable String posteId,
            @Valid @RequestBody LigneBdpUpdateDto body) {
        return ResponseEntity.ok(service.majLigne(chantierId, posteId, body));
    }

    @DeleteMapping("/lignes/{posteId}")
    @RequirePermission("chantiers.delete")
    public ResponseEntity<Void> supprimer(
            @PathVariable String chantierId, @PathVariable String posteId) {
        service.supprimerLigne(chantierId, posteId);
        return ResponseEntity.noContent().build();
    }
}
