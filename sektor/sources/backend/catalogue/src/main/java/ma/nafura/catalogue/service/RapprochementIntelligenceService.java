package ma.nafura.catalogue.service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import ma.nafura.catalogue.domain.model.ItemMatch;
import ma.nafura.catalogue.repository.CatalogArticleRepository;
import ma.nafura.catalogue.repository.ItemMatchRepository;
import ma.nafura.catalogue.service.RapprochementDeterministeService.CandidatMatch;
import ma.nafura.catalogue.service.port.LlmRapprochementPort;
import ma.nafura.catalogue.service.port.LlmRapprochementPort.CatalogueSnippet;
import ma.nafura.catalogue.service.port.LlmRapprochementPort.Suggestion;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * Orchestration L16 : déterministe d'abord, LLM uniquement si la liste courte ne tranche pas.
 * Aucune suggestion n'est validée automatiquement.
 */
@Service
public class RapprochementIntelligenceService {

    /** Confiance mini pour considérer le top déterministe comme « tranché ». */
    public static final double TRANCHE_MIN = 0.80;
    /** Écart mini top1 − top2 pour trancher sans LLM. */
    public static final double TRANCHE_GAP = 0.15;

    private final RapprochementDeterministeService deterministe;
    private final LlmRapprochementPort llmPort;
    private final RapprochementLlmMetrics metrics;
    private final CatalogArticleRepository articleRepository;
    private final ItemMatchRepository matchRepository;

    public RapprochementIntelligenceService(
            RapprochementDeterministeService deterministe,
            LlmRapprochementPort llmPort,
            RapprochementLlmMetrics metrics,
            CatalogArticleRepository articleRepository,
            ItemMatchRepository matchRepository) {
        this.deterministe = deterministe;
        this.llmPort = llmPort;
        this.metrics = metrics;
        this.articleRepository = articleRepository;
        this.matchRepository = matchRepository;
    }

    @Transactional(readOnly = true)
    public List<CandidatMatch> rechercher(
            String libelle, String sourceType, UUID sourceId, int limit) {
        metrics.incrementRecherche();
        List<CandidatMatch> hits = deterministe.rechercher(libelle, sourceType, sourceId, limit);
        if (tranche(hits)) {
            metrics.incrementSkipDeterministe();
            return hits;
        }
        if (!llmPort.isAvailable()) {
            return hits;
        }
        metrics.incrementLlmAppel();
        List<CatalogueSnippet> corpus = articleRepository.findByStatutOrderByLibelleAsc("PUBLIE").stream()
                .map(a -> new CatalogueSnippet(a.getCleStable(), a.getLibelle(), a.getNature(), a.getUniteCode()))
                .toList();
        List<Suggestion> llmHits = llmPort.suggerer(libelle, corpus, limit);
        if (llmHits == null || llmHits.isEmpty()) {
            return hits;
        }
        List<CandidatMatch> merged = new ArrayList<>(hits);
        for (Suggestion s : llmHits) {
            if (s == null || !StringUtils.hasText(s.catalogCle())) {
                continue;
            }
            boolean exists = merged.stream().anyMatch(h -> h.catalogCle().equals(s.catalogCle()));
            if (!exists) {
                merged.add(new CandidatMatch(
                        s.catalogCle(),
                        s.libelle(),
                        s.nature(),
                        s.uniteCode(),
                        "LLM",
                        s.confiance() != null ? s.confiance() : BigDecimal.valueOf(0.5)));
            }
        }
        return merged.size() > limit ? merged.subList(0, limit) : merged;
    }

    @Transactional
    public List<ItemMatch> suggererEtPersister(
            String libelle, String sourceType, UUID sourceId, int limit) {
        List<CandidatMatch> hits = rechercher(libelle, sourceType, sourceId, limit);
        return persisterHits(hits, libelle, sourceType, sourceId);
    }

    /** Persiste des hits déjà calculés (évite double recherche / double métrique). */
    @Transactional
    public List<ItemMatch> persisterHits(
            List<CandidatMatch> hits, String libelle, String sourceType, UUID sourceId) {
        List<ItemMatch> saved = new ArrayList<>();
        if (hits == null) {
            return saved;
        }
        for (CandidatMatch hit : hits) {
            var existing = matchRepository.findByTenantIdAndSourceTypeAndSourceIdAndCatalogCleAndStatutIn(
                    tenantId(),
                    sourceType,
                    sourceId,
                    hit.catalogCle(),
                    List.of("SUGGERE", "VALIDE"));
            if (existing.isPresent()) {
                saved.add(existing.get());
                continue;
            }
            ItemMatch m = ItemMatch.builder()
                    .tenantId(tenantId())
                    .sourceType(sourceType)
                    .sourceId(sourceId)
                    .catalogCle(hit.catalogCle())
                    .methode(hit.methode())
                    .confiance(hit.confiance())
                    .statut("SUGGERE")
                    .libelleSource(libelle)
                    .modelVersion(modelVersion(hit.methode()))
                    .build();
            saved.add(matchRepository.save(m));
        }
        return saved;
    }

    public ItemMatch valider(UUID matchId, String user) {
        return deterministe.valider(matchId, user);
    }

    public ItemMatch rejeter(UUID matchId, String user) {
        return deterministe.rejeter(matchId, user);
    }

    /** True si le pipeline déterministe tranche sans LLM. */
    public static boolean tranche(List<CandidatMatch> hits) {
        if (hits == null || hits.isEmpty()) {
            return false;
        }
        CandidatMatch top = hits.getFirst();
        if ("EXACT".equals(top.methode())) {
            return true;
        }
        double c1 = top.confiance() != null ? top.confiance().doubleValue() : 0;
        if (c1 < TRANCHE_MIN) {
            return false;
        }
        if (hits.size() == 1) {
            return true;
        }
        double c2 = hits.get(1).confiance() != null ? hits.get(1).confiance().doubleValue() : 0;
        return (c1 - c2) >= TRANCHE_GAP;
    }

    private static String modelVersion(String methode) {
        if ("LLM".equals(methode)) {
            return "l16-llm-dernier-recours-v1";
        }
        return "l15-deterministe-v1";
    }

    private static UUID tenantId() {
        return TenantContext.getTenantId();
    }
}
