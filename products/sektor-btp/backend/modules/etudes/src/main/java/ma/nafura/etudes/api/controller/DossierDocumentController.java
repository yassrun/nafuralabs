package ma.nafura.etudes.api.controller;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import ma.nafura.etudes.api.request.ImportTreeRequest;
import ma.nafura.etudes.domain.model.CpsSection;
import ma.nafura.etudes.domain.model.DossierDocument;
import ma.nafura.etudes.domain.model.Dpgf;
import ma.nafura.etudes.domain.model.DpgfNoeud;
import ma.nafura.etudes.repository.DpgfNoeudRepository;
import ma.nafura.etudes.service.BordereauImportService;
import ma.nafura.etudes.service.DossierDocumentService;
import ma.nafura.etudes.service.cps.CpsService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * Pièces du marché (étape 1) et interrogation CPS.
 *
 * <p>Le dépôt ne fait que stocker. L'extraction bordereau est un endpoint dédié (étape 2).
 */
@RestController
@RequestMapping("/api/v1/etudes/dossiers/{dossierId}/documents")
@SecuredResource(domain = "etudes", feature = "etudes", resource = "dossier")
public class DossierDocumentController {

    private final DossierDocumentService service;
    private final BordereauImportService bordereauImportService;
    private final CpsService cpsService;
    private final DpgfNoeudRepository noeudRepository;

    public DossierDocumentController(
            DossierDocumentService service,
            BordereauImportService bordereauImportService,
            CpsService cpsService,
            DpgfNoeudRepository noeudRepository) {
        this.service = service;
        this.bordereauImportService = bordereauImportService;
        this.cpsService = cpsService;
        this.noeudRepository = noeudRepository;
    }

    @GetMapping
    @RequirePermission("etude.read")
    public ResponseEntity<List<DossierDocument>> lister(@PathVariable UUID dossierId) {
        return ResponseEntity.ok(service.lister(dossierId));
    }

    @PostMapping(consumes = "multipart/form-data")
    @RequirePermission("etude.update")
    public ResponseEntity<?> deposer(
            @PathVariable UUID dossierId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("type") String type) {
        try {
            DossierDocument piece = service.deposer(dossierId, file, type);
            return ResponseEntity.status(HttpStatus.CREATED).body(piece);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest()
                    .body(Map.of("code", ex.getMessage() != null ? ex.getMessage() : "etudes.document.erreur"));
        }
    }

    /**
     * Étape 2 mode auto — prévisualisation sans persistance (revue utilisateur).
     */
    @PostMapping("/{pieceId}/previsualiser-bordereau")
    @RequirePermission("etude.update")
    public ResponseEntity<?> previsualiserBordereau(
            @PathVariable UUID dossierId, @PathVariable UUID pieceId) {
        try {
            ImportTreeRequest arbre = bordereauImportService.previsualiserDepuisPiece(dossierId, pieceId);
            return ResponseEntity.ok(Map.of(
                    "arbre", arbre.getArbre(),
                    "articleCount", BordereauImportService.compterArticles(arbre.getArbre()),
                    "pieceId", pieceId.toString()));
        } catch (IllegalArgumentException | IllegalStateException ex) {
            return ResponseEntity.badRequest()
                    .body(Map.of("code", ex.getMessage() != null ? ex.getMessage() : "etudes.bordereau.erreur"));
        }
    }

    /**
     * Valide un arbre prévisualisé et le rattache au dossier (remplace le DPGF existant).
     */
    @PostMapping("/valider-bordereau")
    @RequirePermission("etude.update")
    public ResponseEntity<?> validerBordereau(
            @PathVariable UUID dossierId,
            @RequestBody ImportTreeRequest body,
            @RequestParam(required = false) UUID pieceId) {
        try {
            Dpgf dpgf = bordereauImportService.validerImport(dossierId, body, pieceId);
            return ResponseEntity.ok(Map.of(
                    "dpgfId", dpgf.getId().toString(),
                    "numero", dpgf.getNumero()));
        } catch (IllegalArgumentException | IllegalStateException ex) {
            return ResponseEntity.badRequest()
                    .body(Map.of("code", ex.getMessage() != null ? ex.getMessage() : "etudes.bordereau.erreur"));
        }
    }

    /**
     * Extraction + persistance immédiate (compat). Préférer prévisualiser → valider.
     */
    @PostMapping("/{pieceId}/extraire-bordereau")
    @RequirePermission("etude.update")
    public ResponseEntity<?> extraireBordereau(
            @PathVariable UUID dossierId, @PathVariable UUID pieceId) {
        try {
            Dpgf dpgf = bordereauImportService.extraireDepuisPiece(dossierId, pieceId);
            return ResponseEntity.ok(Map.of(
                    "dpgfId", dpgf.getId().toString(),
                    "numero", dpgf.getNumero()));
        } catch (IllegalArgumentException | IllegalStateException ex) {
            return ResponseEntity.badRequest()
                    .body(Map.of("code", ex.getMessage() != null ? ex.getMessage() : "etudes.bordereau.erreur"));
        }
    }

    /** Raccourci : première pièce bordereau du dossier. */
    @PostMapping("/extraire-bordereau")
    @RequirePermission("etude.update")
    public ResponseEntity<?> extraireBordereauAuto(@PathVariable UUID dossierId) {
        try {
            Dpgf dpgf = bordereauImportService.extraireDepuisDocumentsStockes(dossierId);
            return ResponseEntity.ok(Map.of(
                    "dpgfId", dpgf.getId().toString(),
                    "numero", dpgf.getNumero()));
        } catch (IllegalArgumentException | IllegalStateException ex) {
            return ResponseEntity.badRequest()
                    .body(Map.of("code", ex.getMessage() != null ? ex.getMessage() : "etudes.bordereau.erreur"));
        }
    }

    /** Étape 2 mode manuel : crée un DPGF vide rattaché au dossier si besoin. */
    @PostMapping("/init-bordereau-manuel")
    @RequirePermission("etude.update")
    public ResponseEntity<?> initBordereauManuel(@PathVariable UUID dossierId) {
        try {
            Dpgf dpgf = bordereauImportService.assurerBordereauManuel(dossierId);
            return ResponseEntity.ok(Map.of(
                    "dpgfId", dpgf.getId().toString(),
                    "numero", dpgf.getNumero()));
        } catch (IllegalArgumentException | IllegalStateException ex) {
            return ResponseEntity.badRequest()
                    .body(Map.of("code", ex.getMessage() != null ? ex.getMessage() : "etudes.bordereau.erreur"));
        }
    }

    @DeleteMapping("/{documentId}")
    @RequirePermission("etude.update")
    public ResponseEntity<Void> supprimer(
            @PathVariable UUID dossierId, @PathVariable UUID documentId) {
        service.supprimer(documentId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/cps/{cpsDocumentId}/sections")
    @RequirePermission("etude.read")
    public ResponseEntity<List<CpsSection>> sections(
            @PathVariable UUID dossierId, @PathVariable UUID cpsDocumentId) {
        return ResponseEntity.ok(cpsService.sections(cpsDocumentId));
    }

    @GetMapping("/cps/{cpsDocumentId}/recherche")
    @RequirePermission("etude.read")
    public ResponseEntity<?> rechercher(
            @PathVariable UUID dossierId,
            @PathVariable UUID cpsDocumentId,
            @RequestParam UUID articleId,
            @RequestParam(defaultValue = "5") int limite) {
        DpgfNoeud article = noeudRepository
                .findByIdAndTenantId(articleId, TenantContext.getTenantId())
                .orElse(null);
        if (article == null) {
            return ResponseEntity.badRequest().body(Map.of("code", "etudes.article.introuvable"));
        }
        return ResponseEntity.ok(cpsService.rechercherPourArticle(cpsDocumentId, article, limite));
    }

    @PostMapping("/cps/{cpsDocumentId}/descriptif-propose")
    @RequirePermission("etude.update")
    public ResponseEntity<?> proposerDescriptif(
            @PathVariable UUID dossierId,
            @PathVariable UUID cpsDocumentId,
            @RequestParam UUID articleId) {
        DpgfNoeud article = noeudRepository
                .findByIdAndTenantId(articleId, TenantContext.getTenantId())
                .orElse(null);
        if (article == null) {
            return ResponseEntity.badRequest().body(Map.of("code", "etudes.article.introuvable"));
        }
        return cpsService.proposerDescriptif(cpsDocumentId, article)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }
}
