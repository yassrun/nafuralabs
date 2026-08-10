package ma.nafura.etudes.api.controller;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import ma.nafura.etudes.api.dto.DecompositionProposeDto;
import ma.nafura.etudes.api.dto.DossierEtudeSyntheseDto;
import ma.nafura.etudes.api.request.DossierEtudeCreateDto;
import ma.nafura.etudes.api.request.DossierEtudeUpdateDto;
import ma.nafura.etudes.api.request.EtapeRequest;
import ma.nafura.etudes.api.request.RefusRequest;
import ma.nafura.etudes.domain.model.DossierEtude;
import ma.nafura.etudes.domain.model.StatutDossierEtude;
import ma.nafura.etudes.service.DecompositionProposeService;
import ma.nafura.etudes.service.DossierEtudeService;
import ma.nafura.etudes.service.DossierEtudeService.GateNonFranchieException;
import ma.nafura.etudes.service.gate.ResultatGate;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/etudes/dossiers")
@SecuredResource(domain = "etudes", feature = "etudes", resource = "dossier")
public class DossierEtudeController {

    private final DossierEtudeService service;
    private final DecompositionProposeService decompositionProposeService;
    private final ma.nafura.etudes.service.SyntheseCoutAffaireService syntheseCoutAffaireService;

    public DossierEtudeController(
            DossierEtudeService service,
            DecompositionProposeService decompositionProposeService,
            ma.nafura.etudes.service.SyntheseCoutAffaireService syntheseCoutAffaireService) {
        this.service = service;
        this.decompositionProposeService = decompositionProposeService;
        this.syntheseCoutAffaireService = syntheseCoutAffaireService;
    }

    @GetMapping
    @RequirePermission("etude.read")
    public ResponseEntity<?> list(
            @RequestParam(required = false) StatutDossierEtude status,
            @RequestParam(required = false) UUID appelOffreClientId) {
        if (appelOffreClientId != null) {
            try {
                return ResponseEntity.ok(service.findByAppelOffreClientId(appelOffreClientId));
            } catch (IllegalArgumentException ex) {
                return ResponseEntity.notFound().build();
            }
        }
        return ResponseEntity.ok(service.list(status));
    }

    @GetMapping("/{id}")
    @RequirePermission("etude.read")
    public ResponseEntity<DossierEtude> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    @RequirePermission("etude.create")
    public ResponseEntity<DossierEtude> create(@Valid @RequestBody DossierEtudeCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(body));
    }

    @PutMapping("/{id}")
    @RequirePermission("etude.update")
    public ResponseEntity<DossierEtude> update(
            @PathVariable UUID id, @Valid @RequestBody DossierEtudeUpdateDto body) {
        return ResponseEntity.ok(service.update(id, body));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("etude.delete")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * État des cinq étapes, sans transition.
     *
     * <p>Le front consomme cet endpoint plutôt que de rejouer les règles de son côté — c'est
     * ce qui évite la divergence front/back qu'avait le module {@code consultation}.
     */
    @GetMapping("/{id}/gates")
    @RequirePermission("etude.read")
    public ResponseEntity<List<ResultatGate>> gates(@PathVariable UUID id) {
        return ResponseEntity.ok(service.evaluerGates(id));
    }

    @GetMapping("/{id}/synthese")
    @RequirePermission("etude.read")
    public ResponseEntity<DossierEtudeSyntheseDto> synthese(@PathVariable UUID id) {
        return ResponseEntity.ok(service.synthese(id));
    }

    @GetMapping("/{id}/synthese-cout")
    @RequirePermission("etude.read")
    public ResponseEntity<ma.nafura.etudes.api.dto.SyntheseCoutAffaireDto> syntheseCout(
            @PathVariable UUID id) {
        return ResponseEntity.ok(syntheseCoutAffaireService.forDossier(id));
    }

    @PutMapping("/{id}/etape")
    @RequirePermission("etude.update")
    public ResponseEntity<DossierEtude> allerAEtape(
            @PathVariable UUID id, @Valid @RequestBody EtapeRequest body) {
        return ResponseEntity.ok(service.allerAEtape(id, body.getEtape()));
    }

    @PostMapping("/{id}/soumettre")
    @RequirePermission("etude.submit")
    public ResponseEntity<DossierEtude> soumettre(@PathVariable UUID id) {
        return ResponseEntity.ok(service.soumettre(id));
    }

    /** Permission distincte de {@code etude.update} — l'auteur ne valide pas son étude. */
    @PostMapping("/{id}/valider")
    @RequirePermission("etude.approve")
    public ResponseEntity<DossierEtude> valider(
            @PathVariable UUID id, Authentication authentication) {
        String approbateur = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(service.valider(id, approbateur));
    }

    @PostMapping("/{id}/refuser")
    @RequirePermission("etude.approve")
    public ResponseEntity<DossierEtude> refuser(
            @PathVariable UUID id, @Valid @RequestBody RefusRequest body) {
        return ResponseEntity.ok(service.refuser(id, body.getMotif()));
    }

    @PostMapping("/{id}/reouvrir-bordereau")
    @RequirePermission("etude.update")
    public ResponseEntity<DossierEtude> reouvrirBordereau(@PathVariable UUID id) {
        return ResponseEntity.ok(service.reouvrirBordereau(id));
    }

    @PostMapping("/{id}/generer-devis")
    @RequirePermission("etude.submit")
    public ResponseEntity<DossierEtude> genererDevis(@PathVariable UUID id) {
        return ResponseEntity.ok(service.genererDevis(id));
    }

    @PostMapping("/{id}/annuler")
    @RequirePermission("etude.update")
    public ResponseEntity<DossierEtude> annuler(@PathVariable UUID id) {
        return ResponseEntity.ok(service.annuler(id));
    }

    /**
     * Propose une décomposition brouillon à partir du CPS / libellé (Gemini + catalogue).
     * Jamais persistée — le front affiche une revue avant ajout.
     */
    @PostMapping("/{id}/articles/{articleId}/decomposition-propose")
    @RequirePermission("etude.update")
    public ResponseEntity<?> proposerDecomposition(
            @PathVariable UUID id,
            @PathVariable UUID articleId,
            @RequestParam(required = false) UUID cpsDocumentId) {
        try {
            return decompositionProposeService
                    .proposer(id, articleId, cpsDocumentId)
                    .<ResponseEntity<?>>map(ResponseEntity::ok)
                    .orElseGet(() -> ResponseEntity.noContent().build());
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("code", ex.getMessage()));
        }
    }

    /**
     * Un gate non franchi renvoie 422 avec la <b>liste des articles fautifs</b>, pour que
     * l'interface affiche des liens cliquables plutôt qu'un bouton grisé sans explication.
     */
    @ExceptionHandler(GateNonFranchieException.class)
    public ResponseEntity<Map<String, Object>> onGateNonFranchie(GateNonFranchieException ex) {
        return ResponseEntity.unprocessableEntity()
                .body(Map.of("code", ex.getMessage(), "gate", ex.getResultat()));
    }
}
