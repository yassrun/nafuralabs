package ma.nafura.catalogue.api.dto;

/**
 * Nature d'article exposée en lecture seule ({@code GET /api/v1/article-natures}).
 */
public record NatureDto(
        String code,
        String libelle,
        boolean stockable,
        boolean valorise,
        String uomDefaut,
        String posteBudgetDefaut,
        String typeDpu) {}
