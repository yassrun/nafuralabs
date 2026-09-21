package ma.nafura.catalogue.service;

import jakarta.persistence.criteria.Predicate;
import java.math.BigDecimal;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import ma.nafura.catalogue.api.IdentiteClasse;
import ma.nafura.catalogue.domain.article.Item;
import ma.nafura.catalogue.domain.ouvrage.CatalogArticle;
import ma.nafura.catalogue.repository.CatalogArticleRepository;
import ma.nafura.catalogue.repository.ItemRepository;
import ma.nafura.catalogue.service.port.capability.LlmRapprochementPort;
import ma.nafura.catalogue.service.port.capability.LlmRapprochementPort.CatalogueSnippet;
import ma.nafura.catalogue.service.port.capability.LlmRapprochementPort.Suggestion;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * Extraire : d'abord le catalogue tenant (article déjà là), puis l'IA vers une identité Sektor.
 * Match 2+ identités Extraire → INCERTAIN, jamais le meilleur score en silence.
 */
@Service
public class ExtraireIdentiteService {

    static final BigDecimal SEUIL = new BigDecimal("0.50");
    static final double SCORE_TENANT = 0.8;

    private final CatalogArticleRepository articleRepository;
    private final ItemRepository itemRepository;
    private final LlmRapprochementPort llm;

    public ExtraireIdentiteService(
            CatalogArticleRepository articleRepository,
            ItemRepository itemRepository,
            LlmRapprochementPort llm) {
        this.articleRepository = articleRepository;
        this.itemRepository = itemRepository;
        this.llm = llm;
    }

    public IdentiteClasse classer(String designation, String nature) {
        if (!StringUtils.hasText(designation)) {
            return IdentiteClasse.aCreer(null, null, null);
        }
        String trimmed = designation.trim();
        Item tenantItem = matchTenantItem(trimmed);
        if (tenantItem != null && tenantItem.getId() != null) {
            return IdentiteClasse.dejaTenant(
                    tenantItem.getCleStable(),
                    tenantItem.getName(),
                    tenantItem.getId().toString(),
                    null);
        }
        String query = annotateTinySpec(trimmed);
        List<CatalogueSnippet> corpus = corpus(nature);
        List<Suggestion> hits = llm.isAvailable() ? llm.suggerer(query, corpus, 5) : List.of();
        List<Suggestion> unique = uniqueByCle(hits);
        if (unique.size() >= 2) {
            return IdentiteClasse.incertain(unique.stream().map(Suggestion::catalogCle).toList());
        }
        if (unique.isEmpty()) {
            return IdentiteClasse.aCreer(null, trimmed, null);
        }
        Suggestion hit = unique.getFirst();
        Item byIdentite = itemRepository
                .findByTenantIdAndCleStable(TenantContext.getTenantId(), hit.catalogCle())
                .orElse(null);
        if (isUsable(byIdentite)) {
            return IdentiteClasse.dejaTenant(
                    hit.catalogCle(), hit.libelle(), byIdentite.getId().toString(), null);
        }
        return IdentiteClasse.aCreer(hit.catalogCle(), hit.libelle(), null);
    }

    /**
     * Article déjà sur le tenant : slug de la désignation, sinon nom / code uniques.
     * Ne dépend pas de l'IA ni du corpus Extraire.
     */
    Item matchTenantItem(String designation) {
        UUID tenantId = TenantContext.getTenantIdOrNull();
        if (tenantId == null || !StringUtils.hasText(designation)) {
            return null;
        }
        String slug = slugOrNull(designation);
        if (StringUtils.hasText(slug)) {
            Item byCle = itemRepository.findByTenantIdAndCleStable(tenantId, slug).orElse(null);
            if (isUsable(byCle)) {
                return byCle;
            }
        }
        String folded = fold(designation);
        if (!StringUtils.hasText(folded)) {
            return null;
        }
        String like = "%" + designation.trim().toLowerCase(Locale.ROOT) + "%";
        String likeFolded = "%" + folded + "%";
        Specification<Item> spec = (root, query, cb) -> {
            List<Predicate> preds = new ArrayList<>();
            preds.add(cb.equal(root.get("tenantId"), tenantId));
            preds.add(cb.or(cb.isTrue(root.get("isActive")), cb.isNull(root.get("isActive"))));
            List<Predicate> text = new ArrayList<>();
            text.add(cb.like(cb.lower(root.get("name")), like));
            text.add(cb.like(cb.lower(cb.coalesce(root.get("code"), "")), like));
            if (!like.equals(likeFolded)) {
                text.add(cb.like(cb.lower(root.get("name")), likeFolded));
                text.add(cb.like(cb.lower(cb.coalesce(root.get("code"), "")), likeFolded));
            }
            if (StringUtils.hasText(slug)) {
                text.add(cb.equal(root.get("cleStable"), slug));
            }
            preds.add(cb.or(text.toArray(Predicate[]::new)));
            return cb.and(preds.toArray(Predicate[]::new));
        };
        List<Item> strong = itemRepository.findAll(spec, PageRequest.of(0, 12)).getContent().stream()
                .filter(ExtraireIdentiteService::isUsable)
                .filter(item -> score(folded, item) >= SCORE_TENANT)
                .toList();
        if (strong.size() == 1) {
            return strong.getFirst();
        }
        List<Item> exact = strong.stream().filter(item -> score(folded, item) >= 0.999).toList();
        return exact.size() == 1 ? exact.getFirst() : null;
    }

    private List<CatalogueSnippet> corpus(String nature) {
        List<CatalogArticle> articles = articleRepository.findByStatutOrderByLibelleAsc("PUBLIE");
        List<CatalogueSnippet> out = new ArrayList<>();
        String natureFilter = StringUtils.hasText(nature) ? nature.trim().toUpperCase(Locale.ROOT) : null;
        for (CatalogArticle a : articles) {
            if (a == null || !StringUtils.hasText(a.getCleStable())) {
                continue;
            }
            if (natureFilter != null
                    && StringUtils.hasText(a.getNature())
                    && !natureFilter.equalsIgnoreCase(a.getNature())
                    && !isCompatibleNature(natureFilter, a.getNature())) {
                continue;
            }
            out.add(new CatalogueSnippet(a.getCleStable(), a.getLibelle(), a.getNature(), a.getUniteCode()));
        }
        return out;
    }

    private static boolean isCompatibleNature(String besoin, String catalog) {
        if ("MATIERE".equals(besoin) || "CONSOMMABLE".equals(besoin)) {
            return "MATIERE".equalsIgnoreCase(catalog) || "CONSOMMABLE".equalsIgnoreCase(catalog);
        }
        return true;
    }

    private static List<Suggestion> uniqueByCle(List<Suggestion> hits) {
        List<Suggestion> unique = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        for (Suggestion s : hits) {
            if (s == null || !StringUtils.hasText(s.catalogCle())) {
                continue;
            }
            if (s.confiance() == null || s.confiance().compareTo(SEUIL) < 0) {
                continue;
            }
            if (!seen.add(s.catalogCle())) {
                continue;
            }
            unique.add(s);
        }
        return unique;
    }

    static String annotateTinySpec(String designation) {
        return designation
                + " — Normalise vers l'identité produit catalogue (nature, unité, famille)."
                + " Ignore couleur, RAL, teinte, marque équivalente, « au choix »."
                + " Exemple : « peinture acrylique blanche » → peinture-acrylique-interieure, pas « peinture blanche ».";
    }

    private static boolean isUsable(Item item) {
        return item != null && item.getId() != null && !Boolean.FALSE.equals(item.getIsActive());
    }

    private static String slugOrNull(String designation) {
        try {
            return CatalogSlug.from(designation);
        } catch (RuntimeException ex) {
            return null;
        }
    }

    static String fold(String raw) {
        if (raw == null) {
            return "";
        }
        return Normalizer.normalize(raw.trim(), Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .toLowerCase(Locale.ROOT);
    }

    static double score(String foldedTerm, Item item) {
        if (!StringUtils.hasText(foldedTerm) || item == null) {
            return 0.0;
        }
        String name = fold(item.getName());
        if (name.equals(foldedTerm)) {
            return 1.0;
        }
        String code = fold(item.getCode());
        if (StringUtils.hasText(code) && code.equals(foldedTerm)) {
            return 1.0;
        }
        if (name.startsWith(foldedTerm)) {
            return 0.8;
        }
        return 0.5;
    }
}
