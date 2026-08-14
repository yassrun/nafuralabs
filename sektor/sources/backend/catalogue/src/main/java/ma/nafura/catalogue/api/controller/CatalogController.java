package ma.nafura.catalogue.api.controller;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import ma.nafura.catalogue.api.dto.CatalogCandidatDto;
import ma.nafura.catalogue.api.request.CatalogEnrichissementContribuerDto;
import ma.nafura.catalogue.api.request.CatalogPublierCandidatDto;
import ma.nafura.catalogue.domain.ouvrage.CatalogArticle;
import ma.nafura.catalogue.domain.edition.CatalogCandidat;
import ma.nafura.catalogue.domain.edition.CatalogEdition;
import ma.nafura.catalogue.domain.ouvrage.CatalogOuvrage;
import ma.nafura.catalogue.repository.CatalogArticleRepository;
import ma.nafura.catalogue.repository.CatalogOuvrageRepository;
import ma.nafura.catalogue.service.CatalogEnrichissementService;
import ma.nafura.catalogue.service.CatalogGouvernanceParams;
import ma.nafura.catalogue.service.CatalogGouvernanceService;
import ma.nafura.catalogue.seeders.CatalogSeedService;
import ma.nafura.catalogue.service.PrixAnomalieService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.framework.context.UserContext;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Console éditoriale + lookup catalogue (L14).
 * Pas de tenant_id — permissions catalogue.* (hors parcours client).
 */
@RestController
@RequestMapping("/api/v1/catalogue")
public class CatalogController {

    private final CatalogGouvernanceService gouvernance;
    private final CatalogGouvernanceParams params;
    private final CatalogSeedService seedService;
    private final CatalogEnrichissementService enrichissement;
    private final PrixAnomalieService prixAnomalie;
    private final CatalogArticleRepository articleRepository;
    private final CatalogOuvrageRepository ouvrageRepository;

    public CatalogController(
            CatalogGouvernanceService gouvernance,
            CatalogGouvernanceParams params,
            CatalogSeedService seedService,
            CatalogEnrichissementService enrichissement,
            PrixAnomalieService prixAnomalie,
            CatalogArticleRepository articleRepository,
            CatalogOuvrageRepository ouvrageRepository) {
        this.gouvernance = gouvernance;
        this.params = params;
        this.seedService = seedService;
        this.enrichissement = enrichissement;
        this.prixAnomalie = prixAnomalie;
        this.articleRepository = articleRepository;
        this.ouvrageRepository = ouvrageRepository;
    }

    @GetMapping("/editions")
    @RequirePermission("catalogue.read")
    public List<CatalogEdition> editions() {
        return seedService.editions();
    }

    @GetMapping("/articles")
    @RequirePermission("catalogue.read")
    public List<CatalogArticle> articles(
            @RequestParam(defaultValue = "PUBLIE") String statut) {
        return articleRepository.findByStatutOrderByLibelleAsc(statut);
    }

    @GetMapping("/ouvrages")
    @RequirePermission("catalogue.read")
    public List<CatalogOuvrage> ouvrages(
            @RequestParam(defaultValue = "PUBLIE") String statut) {
        return ouvrageRepository.findByStatutOrderByLibelleAsc(statut);
    }

    @GetMapping("/candidats")
    @RequirePermission("catalogue.read")
    public List<CatalogCandidatDto> candidats() {
        // L16 AC : sous-seuil n'atteint pas la console éditoriale
        return gouvernance.listerProposesEligibles().stream().map(this::toDto).toList();
    }

    @PostMapping("/enrichissement/contribuer")
    @RequirePermission("catalogue.read")
    public ResponseEntity<?> contribuer(@RequestBody CatalogEnrichissementContribuerDto body) {
        try {
            CatalogCandidat c = enrichissement.contribuer(
                    body.getLibelle(),
                    body.getNature(),
                    body.getUniteCode(),
                    body.getTypeObjet(),
                    body.getProposePar());
            return ResponseEntity.ok(toDto(c));
        } catch (IllegalArgumentException | IllegalStateException ex) {
            return ResponseEntity.badRequest().body(Map.of("code", ex.getMessage()));
        }
    }

    @GetMapping("/prix/anomalie")
    @RequirePermission("catalogue.read")
    public ResponseEntity<?> anomaliePrix(
            @RequestParam(required = false) UUID itemId,
            @RequestParam(required = false) String catalogCle,
            @RequestParam BigDecimal prix) {
        return prixAnomalie
                .evaluer(itemId, catalogCle, prix)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.ok(Map.of(
                        "anormal", false, "messageKey", "catalogue.prix.sans_reference")));
    }

    @PostMapping("/candidats/{id}/publier")
    @RequirePermission("catalogue.publish")
    public ResponseEntity<?> publier(
            @PathVariable UUID id, @RequestBody(required = false) CatalogPublierCandidatDto body) {
        try {
            CatalogPublierCandidatDto dto = body != null ? body : new CatalogPublierCandidatDto();
            CatalogCandidat c = gouvernance.publier(id, dto.getEditionCode(), currentUser());
            return ResponseEntity.ok(toDto(c));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("code", ex.getMessage()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("code", ex.getMessage()));
        }
    }

    @PostMapping("/candidats/{id}/refuser")
    @RequirePermission("catalogue.publish")
    public ResponseEntity<?> refuser(@PathVariable UUID id) {
        try {
            return ResponseEntity.ok(toDto(gouvernance.refuser(id, currentUser())));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("code", ex.getMessage()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("code", ex.getMessage()));
        }
    }

    @PostMapping("/seed-demo")
    @RequirePermission("catalogue.publish")
    public Map<String, Object> seedDemo() {
        return seedService.seedDemoIfEmpty();
    }

    private CatalogCandidatDto toDto(CatalogCandidat c) {
        int seuil = params.seuilPourType(c.getTypeObjet());
        boolean eligible = c.getNbTenantsConfirmants() != null && c.getNbTenantsConfirmants() >= seuil;
        return CatalogCandidatDto.builder()
                .id(c.getId())
                .libellePropose(c.getLibellePropose())
                .nature(c.getNature())
                .uniteCode(c.getUniteCode())
                .codeFamille(c.getCodeFamille())
                .typeObjet(c.getTypeObjet())
                .nbTenantsConfirmants(c.getNbTenantsConfirmants() != null ? c.getNbTenantsConfirmants() : 0)
                .seuilRequis(seuil)
                .eligible(eligible)
                .exemplesLibelles(c.getExemplesLibelles())
                .rendementMin(c.getRendementMin())
                .rendementMax(c.getRendementMax())
                .rendementMedian(c.getRendementMedian())
                .statut(c.getStatut())
                .proposePar(c.getProposePar())
                .modelVersion(c.getModelVersion())
                .catalogCleCreee(c.getCatalogCleCreee())
                .createdAt(c.getCreatedAt())
                .build();
    }

    private static String currentUser() {
        try {
            var id = UserContext.getUserIdOrNull();
            if (id != null) {
                return id.toString();
            }
            String email = UserContext.getUserEmail();
            return email != null ? email : "system";
        } catch (Exception ex) {
            return "system";
        }
    }
}
