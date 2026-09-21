package ma.nafura.etudes.api.controller;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import ma.nafura.etudes.api.dto.DecompositionProposeDto;
import ma.nafura.etudes.api.dto.DossierConversionResultDto;
import ma.nafura.etudes.api.dto.DossierEtudeSyntheseDto;
import ma.nafura.etudes.api.dto.StatusChangeDto;
import ma.nafura.etudes.api.request.DossierConvertirDto;
import ma.nafura.etudes.api.request.DossierEtudeCreateDto;
import ma.nafura.etudes.api.request.DossierEtudeUpdateDto;
import ma.nafura.etudes.api.request.DossierAvisExecutionRetourRequest;
import ma.nafura.etudes.api.request.DossierGoRequest;
import ma.nafura.etudes.api.request.DossierNoGoRequest;
import ma.nafura.etudes.api.request.DossierRefusChargeRequest;
import ma.nafura.etudes.api.request.DossierGagneDto;
import ma.nafura.etudes.api.request.DossierPerduDto;
import ma.nafura.etudes.api.request.GenererDevisDto;
import ma.nafura.etudes.api.dto.GuestLinkCreatedDto;
import ma.nafura.etudes.api.request.EtapeRequest;
import ma.nafura.etudes.api.request.GuestLinkCreateDto;
import ma.nafura.etudes.api.request.RefusRequest;
import ma.nafura.etudes.domain.dossier.DossierEtude;
import ma.nafura.etudes.domain.dossier.StatutDossierEtude;
import ma.nafura.etudes.service.DecompositionProposeService;
import ma.nafura.etudes.service.DossierEtudeService;
import ma.nafura.etudes.service.CompletudeEtudeService;
import ma.nafura.etudes.service.CompletudeGateException;
import ma.nafura.etudes.service.WarningsNonAcceptesException;
import ma.nafura.etudes.service.DossierEtudeService.GateNonFranchieException;
import ma.nafura.etudes.service.DossierEtudeService.PostesOrphelinsException;
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
    private final ma.nafura.etudes.service.DpuService dpuService;
    private final ma.nafura.etudes.service.guest.GuestAccessService guestAccessService;
    private final CompletudeEtudeService completudeEtudeService;
    private final ma.nafura.etudes.service.PrixComposantProposeService prixComposantProposeService;
    private final ma.nafura.etudes.service.HistoriquePrixComposantService historiquePrixComposantService;

    public DossierEtudeController(
            DossierEtudeService service,
            DecompositionProposeService decompositionProposeService,
            ma.nafura.etudes.service.SyntheseCoutAffaireService syntheseCoutAffaireService,
            ma.nafura.etudes.service.DpuService dpuService,
            ma.nafura.etudes.service.guest.GuestAccessService guestAccessService,
            CompletudeEtudeService completudeEtudeService,
            ma.nafura.etudes.service.PrixComposantProposeService prixComposantProposeService,
            ma.nafura.etudes.service.HistoriquePrixComposantService historiquePrixComposantService) {
        this.service = service;
        this.decompositionProposeService = decompositionProposeService;
        this.syntheseCoutAffaireService = syntheseCoutAffaireService;
        this.dpuService = dpuService;
        this.guestAccessService = guestAccessService;
        this.completudeEtudeService = completudeEtudeService;
        this.prixComposantProposeService = prixComposantProposeService;
        this.historiquePrixComposantService = historiquePrixComposantService;
    }

    @GetMapping
    @RequirePermission("etude.read")
    public ResponseEntity<?> list(
            @RequestParam(required = false) StatutDossierEtude status,
            @RequestParam(required = false) UUID appelOffreClientId,
            @RequestParam(required = false) String clientId,
            @RequestParam(required = false) String chargeEtudeUserId,
            @RequestParam(required = false) String affectation,
            @RequestParam(required = false) String delaiDepot,
            @RequestParam(required = false) String aoType,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String attente) {
        if (appelOffreClientId != null) {
            try {
                return ResponseEntity.ok(service.findByAppelOffreClientId(appelOffreClientId));
            } catch (IllegalArgumentException ex) {
                return ResponseEntity.notFound().build();
            }
        }
        return ResponseEntity.ok(service.list(
                status, clientId, chargeEtudeUserId, affectation, delaiDepot, aoType, search, attente));
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
    @RequirePermission("etude.create")
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

    /** Journal des changements de statut (Postgres ; store ES plus tard, même DTO). */
    @GetMapping("/{id}/status-history")
    @RequirePermission("etude.read")
    public ResponseEntity<List<StatusChangeDto>> statusHistory(@PathVariable UUID id) {
        return ResponseEntity.ok(service.historiqueStatut(id));
    }

    /** SEKTOR-211 — read model unique de complétude (AC-1 à AC-4). */
    @GetMapping("/{id}/completude")
    @RequirePermission("etude.read")
    public ResponseEntity<ma.nafura.etudes.api.dto.completude.CompletudeEtude> completude(
            @PathVariable UUID id) {
        return ResponseEntity.ok(completudeEtudeService.evaluer(id));
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

    @PostMapping("/{id}/go")
    @RequirePermission("etude.go")
    public ResponseEntity<DossierEtude> go(
            @PathVariable UUID id, @RequestBody(required = false) DossierGoRequest body) {
        DossierGoRequest payload = body != null ? body : new DossierGoRequest();
        return ResponseEntity.ok(
                service.go(
                        id,
                        payload.getChargeEtudeUserId(),
                        payload.getChargeEtudeNom(),
                        payload.getResponsableExecutionUserId(),
                        payload.getResponsableExecutionNom()));
    }

    /** Renvoi au chargé déjà nommé (rejet chiffrage ou draft après réinit). */
    @PostMapping("/{id}/affecter")
    @RequirePermission("etude.update")
    public ResponseEntity<DossierEtude> affecter(@PathVariable UUID id) {
        return ResponseEntity.ok(service.renvoyerAuCharge(id));
    }

    @PostMapping("/{id}/nogo")
    @RequirePermission("etude.update")
    public ResponseEntity<DossierEtude> nogo(
            @PathVariable UUID id, @RequestBody(required = false) DossierNoGoRequest body) {
        return ResponseEntity.ok(service.nogo(id, body != null ? body.getMotif() : null));
    }

    @PostMapping("/{id}/soumettre-go")
    @RequirePermission("etude.create")
    public ResponseEntity<DossierEtude> soumettreAuDg(@PathVariable UUID id) {
        return ResponseEntity.ok(service.soumettreAuDg(id));
    }

    @PostMapping("/{id}/revenir-draft")
    @RequirePermission("etude.create")
    public ResponseEntity<DossierEtude> revenirAuDraft(@PathVariable UUID id) {
        return ResponseEntity.ok(service.revenirAuDraft(id));
    }

    @PostMapping("/{id}/accepter-affectation")
    @RequirePermission("etude.update")
    public ResponseEntity<DossierEtude> accepterAffectation(@PathVariable UUID id) {
        return ResponseEntity.ok(service.accepterAffectation(id));
    }

    @PostMapping("/{id}/refuser-affectation")
    @RequirePermission("etude.update")
    public ResponseEntity<DossierEtude> refuserAffectation(
            @PathVariable UUID id, @Valid @RequestBody DossierRefusChargeRequest body) {
        return ResponseEntity.ok(service.refuserAffectation(id, body.getType(), body.getMotif()));
    }

    @PostMapping("/{id}/suspendre")
    @RequirePermission("etude.update")
    public ResponseEntity<DossierEtude> suspendre(@PathVariable UUID id) {
        return ResponseEntity.ok(service.suspendreChiffrage(id));
    }

    @PostMapping("/{id}/reprendre")
    @RequirePermission("etude.update")
    public ResponseEntity<DossierEtude> reprendre(@PathVariable UUID id) {
        return ResponseEntity.ok(service.reprendreChiffrage(id));
    }

    @PostMapping("/{id}/soumettre")
    @RequirePermission("etude.submit")
    public ResponseEntity<DossierEtude> soumettre(@PathVariable UUID id) {
        return ResponseEntity.ok(service.soumettre(id));
    }

    @PostMapping("/{id}/avis-execution/favorable")
    @RequirePermission("etude.update")
    public ResponseEntity<DossierEtude> avisExecutionFavorable(@PathVariable UUID id) {
        return ResponseEntity.ok(service.avisExecutionFavorable(id));
    }

    @PostMapping("/{id}/avis-execution/retour")
    @RequirePermission("etude.update")
    public ResponseEntity<DossierEtude> avisExecutionRetour(
            @PathVariable UUID id, @Valid @RequestBody DossierAvisExecutionRetourRequest body) {
        return ResponseEntity.ok(service.avisExecutionRetour(id, body.getCommentaire()));
    }

    /** Permission distincte de {@code etude.update} — l'auteur ne valide pas son étude. */
    @PostMapping("/{id}/valider")
    @RequirePermission("etude.approve")
    public ResponseEntity<DossierEtude> valider(
            @PathVariable UUID id, Authentication authentication) {
        String approbateur = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(service.valider(id, approbateur));
    }

    @PostMapping("/{id}/valider-financier")
    @RequirePermission("etude.approve")
    public ResponseEntity<DossierEtude> validerFinancier(
            @PathVariable UUID id, Authentication authentication) {
        String approbateur = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(service.approuverFinancierement(id, approbateur));
    }

    @PostMapping("/{id}/valider-definitif")
    @RequirePermission("etude.approve")
    public ResponseEntity<DossierEtude> validerDefinitif(
            @PathVariable UUID id, Authentication authentication) {
        String approbateur = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(service.approuverDefinitivement(id, approbateur));
    }

    @PostMapping("/{id}/refuser")
    @RequirePermission("etude.approve")
    public ResponseEntity<DossierEtude> refuser(
            @PathVariable UUID id, @Valid @RequestBody RefusRequest body) {
        return ResponseEntity.ok(service.refuser(id, body.getMotif()));
    }

    @PostMapping("/{id}/refuser-financier")
    @RequirePermission("etude.approve")
    public ResponseEntity<DossierEtude> refuserFinancier(
            @PathVariable UUID id, @Valid @RequestBody RefusRequest body) {
        return ResponseEntity.ok(service.refuserFinancierement(id, body.getMotif()));
    }

    @PostMapping("/{id}/refuser-definitif")
    @RequirePermission("etude.approve")
    public ResponseEntity<DossierEtude> refuserDefinitif(
            @PathVariable UUID id, @Valid @RequestBody RefusRequest body) {
        return ResponseEntity.ok(service.refuserDefinitivement(id, body.getMotif()));
    }

    @PostMapping("/{id}/reouvrir-bordereau")
    @RequirePermission("etude.update")
    public ResponseEntity<DossierEtude> reouvrirBordereau(@PathVariable UUID id) {
        return ResponseEntity.ok(service.reouvrirBordereau(id));
    }

    @PostMapping("/{id}/generer-devis")
    @RequirePermission("etude.submit")
    public ResponseEntity<DossierEtude> genererDevis(
            @PathVariable UUID id, @RequestBody(required = false) GenererDevisDto body) {
        String clientId = body != null ? body.getClientId() : null;
        return ResponseEntity.ok(service.genererDevis(id, clientId));
    }

    @PostMapping("/{id}/annuler")
    @RequirePermission("etude.update")
    public ResponseEntity<DossierEtude> annuler(@PathVariable UUID id) {
        return ResponseEntity.ok(service.annuler(id));
    }

    @PostMapping("/{id}/gagne")
    @RequirePermission("etude.update")
    public ResponseEntity<?> gagne(@PathVariable UUID id, @Valid @RequestBody DossierGagneDto body) {
        try {
            return ResponseEntity.ok(service.gagne(id, body));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("code", ex.getMessage()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("code", ex.getMessage()));
        }
    }

    /** AC-3 — l'attribution diffère du total devis : l'écran montre les deux montants. */
    @ExceptionHandler(DossierEtudeService.AttributionMismatchException.class)
    public ResponseEntity<Map<String, Object>> onAttributionMismatch(
            DossierEtudeService.AttributionMismatchException ex) {
        return ResponseEntity.unprocessableEntity()
                .body(Map.of(
                        "code", ex.getMessage(),
                        "totalDevis", ex.getTotalDevis(),
                        "montantAttribue", ex.getMontantAttribue()));
    }

    /** AC-4 — marge négative refusée aux rôles ordinaires, avec les montants en explication. */
    @ExceptionHandler(DossierEtudeService.MargeNegativeRefuseeException.class)
    public ResponseEntity<Map<String, Object>> onMargeNegativeRefusee(
            DossierEtudeService.MargeNegativeRefuseeException ex) {
        return ResponseEntity.unprocessableEntity()
                .body(Map.of(
                        "code", ex.getMessage(),
                        "montantAttribue", ex.getMontantAttribue(),
                        "debourseInitial", ex.getDebourseInitial()));
    }

    @PostMapping("/{id}/perdu")
    @RequirePermission("etude.update")
    public ResponseEntity<?> perdu(@PathVariable UUID id, @Valid @RequestBody DossierPerduDto body) {
        try {
            return ResponseEntity.ok(service.perdu(id, body));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("code", ex.getMessage()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("code", ex.getMessage()));
        }
    }

    @PostMapping("/{id}/convertir")
    @RequirePermission("etude.update")
    public ResponseEntity<?> convertir(
            @PathVariable UUID id, @RequestBody(required = false) DossierConvertirDto body) {
        try {
            DossierConvertirDto dto = body != null ? body : new DossierConvertirDto();
            DossierConversionResultDto result = service.convertir(id, dto);
            return ResponseEntity.ok(result);
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("code", ex.getMessage()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("code", ex.getMessage()));
        }
    }

    /**
     * Historique de prix d'un composant (achats + consultations). Jamais persisté.
     */
    @GetMapping("/{id}/historique-prix-composant")
    @RequirePermission("etude.read")
    public ResponseEntity<?> historiquePrixComposant(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID itemId,
            @RequestParam(required = false) String designation,
            @RequestParam(required = false) String type) {
        try {
            return ResponseEntity.ok(historiquePrixComposantService.historique(id, itemId, designation, type));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("code", ex.getMessage()));
        }
    }

    /**
     * Propose un PU composant : catalogue interne, sinon estimation IA marché MA.
     * Jamais persisté — le champ n’est écrit que si le chargé accepte.
     */
    @PostMapping("/{id}/proposer-prix-composant")
    @RequirePermission("etude.update")
    public ResponseEntity<?> proposerPrixComposant(
            @PathVariable UUID id,
            @RequestBody(required = false) ma.nafura.etudes.api.request.PrixComposantProposeRequest body) {
        try {
            return prixComposantProposeService
                    .proposer(id, body != null ? body : new ma.nafura.etudes.api.request.PrixComposantProposeRequest())
                    .<ResponseEntity<?>>map(ResponseEntity::ok)
                    .orElseGet(() -> ResponseEntity.noContent().build());
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("code", ex.getMessage()));
        }
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

    @PostMapping("/{id}/guest-links")
    @RequirePermission("etude.update")
    public ResponseEntity<?> createGuestLink(
            @PathVariable UUID id, @Valid @RequestBody GuestLinkCreateDto body) {
        try {
            GuestLinkCreatedDto created = guestAccessService.create(id, body);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest()
                    .body(Map.of("code", ex.getMessage() != null ? ex.getMessage() : "etudes.guest.erreur"));
        }
    }

    /** L5 — rafraîchit les prix gelés ITEM de tous les DPU du dossier (étude non validée). */
    @PostMapping("/{id}/refresh-prices")
    @RequirePermission("etude.update")
    public ResponseEntity<?> refreshPrices(@PathVariable UUID id) {
        try {
            int refreshed = dpuService.refreshPricesForDossier(id);
            return ResponseEntity.ok(Map.of("dpuRefreshed", refreshed));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("code", ex.getMessage()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("code", ex.getMessage()));
        }
    }

    /**
     * Un gate non franchi renvoie 422 avec la <b>liste des articles fautifs</b>, pour que
     * l'interface affiche des liens cliquables plutôt qu'un bouton grisé sans explication.
     */
    /**
     * AC-12 — des postes du devis n'ont pas de lot d'accueil : la conversion s'est arrêtée avant
     * de rien créer, et renvoie 422 avec la <b>liste nommée</b> des postes à placer. L'écran les
     * affiche ; l'humain place, ou abandonne — et dans ce cas rien n'existe.
     */
    @ExceptionHandler(PostesOrphelinsException.class)
    public ResponseEntity<Map<String, Object>> onPostesOrphelins(PostesOrphelinsException ex) {
        return ResponseEntity.unprocessableEntity()
                .body(Map.of(
                        "code", ex.getMessage(),
                        "postesOrphelins", ex.getPostes(),
                        "lotsDisponibles", ex.getLotsDisponibles()));
    }

    @ExceptionHandler(GateNonFranchieException.class)
    public ResponseEntity<Map<String, Object>> onGateNonFranchie(GateNonFranchieException ex) {
        return ResponseEntity.unprocessableEntity()
                .body(Map.of("code", ex.getMessage(), "gate", ex.getResultat()));
    }

    /** SEKTOR-211 — contrôle BLOCKING actif avant gain ou conversion. */
    @ExceptionHandler(CompletudeGateException.class)
    public ResponseEntity<Map<String, Object>> onCompletudeGate(CompletudeGateException ex) {
        return ResponseEntity.unprocessableEntity()
                .body(Map.of("code", ex.getMessage(), "controles", ex.getControles()));
    }

    /** SEKTOR-211 — warnings commerciaux non acceptés. */
    @ExceptionHandler(WarningsNonAcceptesException.class)
    public ResponseEntity<Map<String, Object>> onWarningsNonAcceptes(WarningsNonAcceptesException ex) {
        return ResponseEntity.unprocessableEntity()
                .body(Map.of("code", ex.getMessage(), "controles", ex.getControles()));
    }
}
