package ma.nafura.catalogue.service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import ma.nafura.catalogue.api.IdentiteClasse;
import ma.nafura.catalogue.domain.article.Item;
import ma.nafura.catalogue.domain.ouvrage.CatalogArticle;
import ma.nafura.catalogue.repository.CatalogArticleRepository;
import ma.nafura.catalogue.repository.ItemRepository;
import ma.nafura.catalogue.service.port.capability.LlmRapprochementPort;
import ma.nafura.catalogue.service.port.capability.LlmRapprochementPort.CatalogueSnippet;
import ma.nafura.catalogue.service.port.capability.LlmRapprochementPort.Suggestion;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * Extraire : IA normalise vers une identité Sektor, puis deux seaux (tenant / à créer).
 * Match 2+ identités → INCERTAIN, jamais le meilleur score en silence.
 */
@Service
public class ExtraireIdentiteService {

    static final BigDecimal SEUIL = new BigDecimal("0.50");

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
        String query = annotateTinySpec(designation.trim());
        List<CatalogueSnippet> corpus = corpus(nature);
        List<Suggestion> hits = llm.isAvailable() ? llm.suggerer(query, corpus, 5) : List.of();
        List<Suggestion> unique = uniqueByCle(hits);
        if (unique.size() >= 2) {
            return IdentiteClasse.incertain(unique.stream().map(Suggestion::catalogCle).toList());
        }
        if (unique.isEmpty()) {
            return IdentiteClasse.aCreer(null, designation.trim(), null);
        }
        Suggestion hit = unique.getFirst();
        Item tenantItem = itemRepository
                .findByTenantIdAndCleStable(TenantContext.getTenantId(), hit.catalogCle())
                .orElse(null);
        if (tenantItem != null) {
            return IdentiteClasse.dejaTenant(
                    hit.catalogCle(), hit.libelle(), tenantItem.getId().toString(), null);
        }
        return IdentiteClasse.aCreer(hit.catalogCle(), hit.libelle(), null);
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
}
