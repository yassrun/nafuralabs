package ma.nafura.catalogue.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import ma.nafura.catalogue.domain.model.CatalogArticle;
import ma.nafura.catalogue.domain.model.ItemMatch;
import ma.nafura.catalogue.repository.CatalogArticleRepository;
import ma.nafura.catalogue.repository.ItemMatchRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * Pipeline L15 : normalisation → EXACT → REGLE → TRIGRAM → liste courte.
 * Aucun appel LLM.
 */
@Service
public class RapprochementDeterministeService {

    public static final double TRIGRAM_MIN = 0.35;
    public static final double REGLE_MIN = 0.55;

    private final CatalogArticleRepository articleRepository;
    private final ItemMatchRepository matchRepository;

    public RapprochementDeterministeService(
            CatalogArticleRepository articleRepository, ItemMatchRepository matchRepository) {
        this.articleRepository = articleRepository;
        this.matchRepository = matchRepository;
    }

    public record CandidatMatch(
            String catalogCle,
            String libelle,
            String nature,
            String uniteCode,
            String methode,
            BigDecimal confiance) {}

    @Transactional(readOnly = true)
    public List<CandidatMatch> rechercher(
            String libelle, String sourceType, UUID sourceId, int limit) {
        int safeLimit = limit > 0 ? Math.min(limit, 20) : 10;
        String qNorm = LibelleNormalizer.normalize(libelle);
        if (!StringUtils.hasText(qNorm)) {
            return List.of();
        }

        Set<String> rejected = new HashSet<>();
        if (sourceId != null && StringUtils.hasText(sourceType)) {
            rejected.addAll(matchRepository.findRejectedCles(tenantId(), sourceType, sourceId));
        }

        List<CatalogArticle> articles = articleRepository.findByStatutOrderByLibelleAsc("PUBLIE");
        List<CandidatMatch> hits = new ArrayList<>();

        for (CatalogArticle art : articles) {
            if (rejected.contains(art.getCleStable())) {
                continue;
            }
            String cNorm = LibelleNormalizer.normalize(art.getLibelle());
            CandidatMatch hit = scoreOne(qNorm, art, cNorm);
            if (hit != null) {
                hits.add(hit);
            }
        }

        hits.sort(Comparator.comparing(CandidatMatch::confiance).reversed());
        if (hits.size() > safeLimit) {
            return hits.subList(0, safeLimit);
        }
        return hits;
    }

    /** Variante testable / perf — catalogue injecté en mémoire. */
    public List<CandidatMatch> rechercherSurCorpus(
            String libelle, List<CatalogArticle> articles, Set<String> rejected, int limit) {
        int safeLimit = limit > 0 ? Math.min(limit, 20) : 10;
        String qNorm = LibelleNormalizer.normalize(libelle);
        if (!StringUtils.hasText(qNorm)) {
            return List.of();
        }
        Set<String> rej = rejected != null ? rejected : Set.of();
        List<CandidatMatch> hits = new ArrayList<>();
        for (CatalogArticle art : articles) {
            if (rej.contains(art.getCleStable())) {
                continue;
            }
            String cNorm = LibelleNormalizer.normalize(art.getLibelle());
            CandidatMatch hit = scoreOne(qNorm, art, cNorm);
            if (hit != null) {
                hits.add(hit);
            }
        }
        hits.sort(Comparator.comparing(CandidatMatch::confiance).reversed());
        if (hits.size() > safeLimit) {
            return hits.subList(0, safeLimit);
        }
        return hits;
    }

    @Transactional
    public List<ItemMatch> suggererEtPersister(
            String libelle, String sourceType, UUID sourceId, int limit) {
        List<CandidatMatch> hits = rechercher(libelle, sourceType, sourceId, limit);
        List<ItemMatch> saved = new ArrayList<>();
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
                    .modelVersion("l15-deterministe-v1")
                    .build();
            saved.add(matchRepository.save(m));
        }
        return saved;
    }

    @Transactional
    public ItemMatch valider(UUID matchId, String user) {
        ItemMatch m = requireMatch(matchId);
        if ("REJETE".equals(m.getStatut())) {
            throw new IllegalStateException("catalogue.match.deja_rejete");
        }
        m.setStatut("VALIDE");
        m.setValidePar(user);
        m.setValideLe(java.time.OffsetDateTime.now());
        return matchRepository.save(m);
    }

    @Transactional
    public ItemMatch rejeter(UUID matchId, String user) {
        ItemMatch m = requireMatch(matchId);
        m.setStatut("REJETE");
        m.setValidePar(user);
        m.setValideLe(java.time.OffsetDateTime.now());
        return matchRepository.save(m);
    }

    @Transactional
    public ItemMatch creerManuel(
            String sourceType, UUID sourceId, String catalogCle, String libelle, String user) {
        ItemMatch m = ItemMatch.builder()
                .tenantId(tenantId())
                .sourceType(sourceType)
                .sourceId(sourceId)
                .catalogCle(catalogCle)
                .methode("MANUEL")
                .confiance(BigDecimal.ONE.setScale(4, RoundingMode.HALF_UP))
                .statut("VALIDE")
                .validePar(user)
                .valideLe(java.time.OffsetDateTime.now())
                .libelleSource(libelle)
                .modelVersion("l15-deterministe-v1")
                .build();
        return matchRepository.save(m);
    }

    private CandidatMatch scoreOne(String qNorm, CatalogArticle art, String cNorm) {
        if (qNorm.equals(cNorm) || LibelleNormalizer.sortedTokenKey(qNorm)
                .equals(LibelleNormalizer.sortedTokenKey(cNorm))) {
            return candidat(art, "EXACT", 1.0);
        }
        double regle = RegleSynonymes.score(qNorm, cNorm);
        if (regle >= REGLE_MIN) {
            return candidat(art, "REGLE", regle);
        }
        double tri = TrigramSimilarity.score(qNorm, cNorm);
        if (tri >= TRIGRAM_MIN) {
            return candidat(art, "TRIGRAM", tri);
        }
        return null;
    }

    private static CandidatMatch candidat(CatalogArticle art, String methode, double score) {
        return new CandidatMatch(
                art.getCleStable(),
                art.getLibelle(),
                art.getNature(),
                art.getUniteCode(),
                methode,
                BigDecimal.valueOf(score).setScale(4, RoundingMode.HALF_UP));
    }

    private ItemMatch requireMatch(UUID id) {
        ItemMatch m = matchRepository
                .findById(id)
                .orElseThrow(() -> new IllegalArgumentException("catalogue.match.introuvable"));
        if (!tenantId().equals(m.getTenantId())) {
            throw new IllegalArgumentException("catalogue.match.introuvable");
        }
        return m;
    }

    private static UUID tenantId() {
        return TenantContext.getTenantId();
    }
}
