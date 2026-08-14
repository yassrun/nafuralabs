package ma.nafura.catalogue.api.controller;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import ma.nafura.catalogue.api.dto.RapprochementCandidatDto;
import ma.nafura.catalogue.api.request.RapprochementSearchDto;
import ma.nafura.catalogue.domain.article.ItemMatch;
import ma.nafura.catalogue.service.RapprochementDeterministeService.CandidatMatch;
import ma.nafura.catalogue.service.RapprochementIntelligenceService;
import ma.nafura.catalogue.service.RapprochementLlmMetrics;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.framework.context.UserContext;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/catalogue/rapprochement")
public class RapprochementController {

    private final RapprochementIntelligenceService service;
    private final RapprochementLlmMetrics metrics;

    public RapprochementController(RapprochementIntelligenceService service, RapprochementLlmMetrics metrics) {
        this.service = service;
        this.metrics = metrics;
    }

    @PostMapping("/search")
    @RequirePermission("catalogue.read")
    public ResponseEntity<?> search(@RequestBody RapprochementSearchDto body) {
        try {
            int limit = body.getLimit() != null ? body.getLimit() : 10;
            List<CandidatMatch> hits =
                    service.rechercher(body.getLibelle(), body.getSourceType(), body.getSourceId(), limit);

            List<ItemMatch> saved = List.of();
            if (body.isPersister()
                    && body.getSourceId() != null
                    && body.getSourceType() != null
                    && !body.getSourceType().isBlank()) {
                saved = service.persisterHits(
                        hits, body.getLibelle(), body.getSourceType(), body.getSourceId());
            }

            return ResponseEntity.ok(toDtos(hits, saved));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("code", ex.getMessage()));
        }
    }

    @GetMapping("/metrics")
    @RequirePermission("catalogue.read")
    public Map<String, Object> metrics() {
        return Map.of(
                "recherches", metrics.recherches(),
                "llmAppels", metrics.llmAppels(),
                "llmSkipsDeterministe", metrics.llmSkipsDeterministe(),
                "tauxAppelLlm", metrics.tauxAppelLlm());
    }

    @PostMapping("/{id}/valider")
    @RequirePermission("catalogue.read")
    public ResponseEntity<?> valider(@PathVariable UUID id) {
        try {
            return ResponseEntity.ok(service.valider(id, currentUser()));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("code", ex.getMessage()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("code", ex.getMessage()));
        }
    }

    @PostMapping("/{id}/rejeter")
    @RequirePermission("catalogue.read")
    public ResponseEntity<?> rejeter(@PathVariable UUID id) {
        try {
            return ResponseEntity.ok(service.rejeter(id, currentUser()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("code", ex.getMessage()));
        }
    }

    private static List<RapprochementCandidatDto> toDtos(List<CandidatMatch> hits, List<ItemMatch> saved) {
        return hits.stream()
                .map(h -> {
                    ItemMatch match = saved.stream()
                            .filter(m -> m.getCatalogCle().equals(h.catalogCle()))
                            .findFirst()
                            .orElse(null);
                    return RapprochementCandidatDto.builder()
                            .catalogCle(h.catalogCle())
                            .libelle(h.libelle())
                            .nature(h.nature())
                            .uniteCode(h.uniteCode())
                            .methode(h.methode())
                            .confiance(h.confiance())
                            .matchId(match != null ? match.getId() : null)
                            .statut(match != null ? match.getStatut() : "SUGGERE")
                            .build();
                })
                .toList();
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
