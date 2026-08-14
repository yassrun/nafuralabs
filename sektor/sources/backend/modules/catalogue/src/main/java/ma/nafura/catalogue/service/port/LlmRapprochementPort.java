package ma.nafura.catalogue.service.port;

import java.math.BigDecimal;
import java.util.List;

/**
 * LLM en dernier recours pour le rapprochement (L16).
 * Ne doit être appelé que si le pipeline déterministe ne tranche pas.
 */
public interface LlmRapprochementPort {

    boolean isAvailable();

    /**
     * Propose des clés catalogue pour un libellé non tranché.
     * Ne persiste jamais — le caller crée des {@code ItemMatch} SUGGERE.
     */
    List<Suggestion> suggerer(String libelle, List<CatalogueSnippet> corpus, int limit);

    record CatalogueSnippet(String catalogCle, String libelle, String nature, String uniteCode) {}

    record Suggestion(
            String catalogCle, String libelle, String nature, String uniteCode, BigDecimal confiance) {}
}
