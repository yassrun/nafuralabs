package ma.nafura.etudes.api.controller;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import ma.nafura.etudes.domain.model.CpsSection;
import ma.nafura.etudes.domain.model.DossierDocument;
import ma.nafura.etudes.domain.model.DpgfNoeud;
import ma.nafura.etudes.repository.DpgfNoeudRepository;
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
 * Pieces du marche et interrogation du CPS.
 *
 * <p>Le parcours demarre par le depot des documents. Le CPS devient ensuite une ressource
 * interrogeable pendant toute la decomposition, au lieu d'une passe globale d'appariement par
 * code — fragile, parce qu'un CPS est de la prose organisee par chapitres.
 */
@RestController
@RequestMapping("/api/v1/etudes/dossiers/{dossierId}/documents")
@SecuredResource(domain = "etudes", feature = "etudes", resource = "dossier")
public class DossierDocumentController {

    private final DossierDocumentService service;
    private final CpsService cpsService;
    private final DpgfNoeudRepository noeudRepository;

    public DossierDocumentController(
            DossierDocumentService service,
            CpsService cpsService,
            DpgfNoeudRepository noeudRepository) {
        this.service = service;
        this.cpsService = cpsService;
        this.noeudRepository = noeudRepository;
    }

    @GetMapping
    @RequirePermission("etude.read")
    public ResponseEntity<List<DossierDocument>> lister(@PathVariable UUID dossierId) {
        return ResponseEntity.ok(service.lister(dossierId));
    }

    /**
     * Depose une piece du marche.
     *
     * <p>Aucun format n'est refuse : le CPS vient du maitre d'ouvrage, l'utilisateur ne choisit
     * pas. Un scan est conserve et consultable ; seule son indexation automatique est
     * indisponible, ce que le statut renvoye indique.
     */
    @PostMapping(consumes = "multipart/form-data")
    @RequirePermission("etude.update")
    public ResponseEntity<?> deposer(
            @PathVariable UUID dossierId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("type") String type,
            @RequestParam(value = "documentId", required = false) String documentId) {
        try {
            String ref = documentId != null ? documentId : UUID.randomUUID().toString();
            DossierDocument piece = service.deposer(
                    dossierId, ref, file.getOriginalFilename(), type, file.getBytes());
            return ResponseEntity.status(HttpStatus.CREATED).body(piece);
        } catch (IOException ex) {
            return ResponseEntity.badRequest()
                    .body(Map.of("code", "etudes.document.lecture_impossible"));
        }
    }

    @DeleteMapping("/{documentId}")
    @RequirePermission("etude.update")
    public ResponseEntity<Void> supprimer(
            @PathVariable UUID dossierId, @PathVariable UUID documentId) {
        service.supprimer(documentId);
        return ResponseEntity.noContent().build();
    }

    /** Sections du CPS, dans l'ordre du document — pour la consultation directe. */
    @GetMapping("/cps/{cpsDocumentId}/sections")
    @RequirePermission("etude.read")
    public ResponseEntity<List<CpsSection>> sections(
            @PathVariable UUID dossierId, @PathVariable UUID cpsDocumentId) {
        return ResponseEntity.ok(cpsService.sections(cpsDocumentId));
    }

    /**
     * Sections pertinentes pour un article donne.
     *
     * <p>Recherche plein texte Postgres : <b>aucun token LLM consomme</b>. C'est ce que le
     * chiffreur consulte pendant la decomposition.
     */
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

    /**
     * Descriptif propose par le modele, a partir des seules sections retenues.
     *
     * <p>204 si aucun port IA n'est cable ou si les sections ne permettent pas de conclure — le
     * parcours reste utilisable, le chiffreur lit les sections et redige lui-meme.
     *
     * <p>La proposition n'est jamais persistee ici : elle est retournee, l'utilisateur valide.
     */
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
