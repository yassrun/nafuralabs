package ma.nafura.platform.documents.docextractor.domain.model.catalog;

import java.util.List;

/**
 * Generic domain catalog for Doc-Extractor UI filters.
 * Product-specific domains (btp, chantiers, achats, …) are seeded as values on
 * document types by the product Liquibase data — not hard-coded here.
 */
public final class DomainCatalog {

    private DomainCatalog() {}

    public record Domain(String key, String label) {}

    /**
     * Baseline cross-product domains. Additional keys appear from seeded doc types.
     */
    public static List<Domain> v1() {
        return List.of(
                new Domain("finance", "Accounting & Finance"),
                new Domain("logistic", "Logistics"),
                new Domain("inventory", "Inventory")
        );
    }
}
