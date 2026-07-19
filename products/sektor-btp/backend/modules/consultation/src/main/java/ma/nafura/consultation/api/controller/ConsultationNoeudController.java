package ma.nafura.consultation.api.controller;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import ma.nafura.consultation.api.dto.CatalogCandidateDto;
import ma.nafura.consultation.api.request.ComposantInputDto;
import ma.nafura.consultation.api.request.CreateItemRequest;
import ma.nafura.consultation.api.request.ImportComposantDto;
import ma.nafura.consultation.api.request.LinkItemRequest;
import ma.nafura.consultation.api.request.NoeudUpdateDto;
import ma.nafura.consultation.api.request.PostePricingDto;
import ma.nafura.consultation.api.request.SetModeRequest;
import ma.nafura.consultation.domain.model.ConsultationComposant;
import ma.nafura.consultation.domain.model.ConsultationNoeud;
import ma.nafura.consultation.service.CatalogLinkService;
import ma.nafura.consultation.service.ConsultationNoeudService;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/consultation")
@SecuredResource(domain = "consultation", feature = "consultation", resource = "noeud")
public class ConsultationNoeudController {

    private final ConsultationNoeudService noeudService;
    private final CatalogLinkService catalogLinkService;

    public ConsultationNoeudController(
            ConsultationNoeudService noeudService, CatalogLinkService catalogLinkService) {
        this.noeudService = noeudService;
        this.catalogLinkService = catalogLinkService;
    }

    // ── POSTE mode / descriptif / pricing ──────────────────────────────────────

    @PutMapping("/noeuds/{noeudId}")
    @RequirePermission("consultation.update")
    public ResponseEntity<ConsultationNoeud> updateNoeud(
            @PathVariable UUID noeudId, @RequestBody NoeudUpdateDto body) {
        return ResponseEntity.ok(noeudService.updateNoeud(noeudId, body));
    }

    @DeleteMapping("/noeuds/{noeudId}")
    @RequirePermission("consultation.update")
    public ResponseEntity<Void> deleteNoeud(@PathVariable UUID noeudId) {
        noeudService.deleteNoeud(noeudId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/noeuds/{noeudId}/mode")
    @RequirePermission("consultation.update")
    public ResponseEntity<ConsultationNoeud> setMode(
            @PathVariable UUID noeudId, @Valid @RequestBody SetModeRequest body) {
        return ResponseEntity.ok(noeudService.setMode(noeudId, body.getMode()));
    }

    @PutMapping("/noeuds/{noeudId}/descriptif")
    @RequirePermission("consultation.update")
    public ResponseEntity<ConsultationNoeud> updateDescriptif(
            @PathVariable UUID noeudId, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(noeudService.updateDescriptif(noeudId, body.get("descriptif")));
    }

    @PutMapping("/noeuds/{noeudId}/pricing")
    @RequirePermission("consultation.update")
    public ResponseEntity<ConsultationNoeud> updatePricing(
            @PathVariable UUID noeudId, @RequestBody PostePricingDto body) {
        return ResponseEntity.ok(noeudService.updatePricing(noeudId, body));
    }

    @PostMapping("/noeuds/{noeudId}/suggest-descriptif")
    @RequirePermission("consultation.update")
    public ResponseEntity<Map<String, Object>> suggestDescriptif(@PathVariable UUID noeudId) {
        String descriptif = noeudService.suggestDescriptif(noeudId);
        return ResponseEntity.ok(Map.of(
                "available", noeudService.isDescriptifResolverAvailable(),
                "descriptif", descriptif != null ? descriptif : ""));
    }

    @PostMapping("/noeuds/{noeudId}/suggest-decomposition")
    @RequirePermission("consultation.update")
    public ResponseEntity<Map<String, Object>> suggestDecomposition(@PathVariable UUID noeudId) {
        List<ImportComposantDto> suggestions = noeudService.suggestDecomposition(noeudId);
        return ResponseEntity.ok(Map.of(
                "available", noeudService.isDecompositionSuggestionAvailable(),
                "composants", suggestions));
    }

    // ── Composants CRUD ─────────────────────────────────────────────────────────

    @PostMapping("/noeuds/{noeudId}/composants")
    @RequirePermission("consultation.update")
    public ResponseEntity<ConsultationComposant> addComposant(
            @PathVariable UUID noeudId, @Valid @RequestBody ComposantInputDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(noeudService.addComposant(noeudId, body));
    }

    @PutMapping("/composants/{composantId}")
    @RequirePermission("consultation.update")
    public ResponseEntity<ConsultationComposant> updateComposant(
            @PathVariable UUID composantId, @RequestBody ComposantInputDto body) {
        return ResponseEntity.ok(noeudService.updateComposant(composantId, body));
    }

    @DeleteMapping("/composants/{composantId}")
    @RequirePermission("consultation.update")
    public ResponseEntity<Void> deleteComposant(@PathVariable UUID composantId) {
        noeudService.deleteComposant(composantId);
        return ResponseEntity.noContent().build();
    }

    // ── Catalog linking ─────────────────────────────────────────────────────────

    @GetMapping("/catalog/candidates")
    @RequirePermission("consultation.read")
    public ResponseEntity<List<CatalogCandidateDto>> candidates(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String type,
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(catalogLinkService.candidates(q, type, limit));
    }

    @PostMapping("/noeuds/{noeudId}/link-item")
    @RequirePermission("consultation.update")
    public ResponseEntity<ConsultationNoeud> linkNoeud(
            @PathVariable UUID noeudId, @Valid @RequestBody LinkItemRequest body) {
        return ResponseEntity.ok(catalogLinkService.linkNoeud(noeudId, body));
    }

    @PostMapping("/noeuds/{noeudId}/create-item")
    @RequirePermission("consultation.update")
    public ResponseEntity<ConsultationNoeud> createItemForNoeud(
            @PathVariable UUID noeudId, @RequestBody CreateItemRequest body) {
        return ResponseEntity.ok(catalogLinkService.createItemForNoeud(noeudId, body));
    }

    @PostMapping("/composants/{composantId}/link-item")
    @RequirePermission("consultation.update")
    public ResponseEntity<ConsultationComposant> linkComposant(
            @PathVariable UUID composantId, @Valid @RequestBody LinkItemRequest body) {
        return ResponseEntity.ok(catalogLinkService.linkComposant(composantId, body));
    }

    @PostMapping("/composants/{composantId}/create-item")
    @RequirePermission("consultation.update")
    public ResponseEntity<ConsultationComposant> createItemForComposant(
            @PathVariable UUID composantId, @RequestBody CreateItemRequest body) {
        return ResponseEntity.ok(catalogLinkService.createItemForComposant(composantId, body));
    }
}
