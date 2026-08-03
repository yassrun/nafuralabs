package ma.nafura.platform.documents.docextractor.domain.model.catalog;

import java.util.List;

/**
 * Canonical domain catalog for Doc-Extractor.
 * <p>
 * Kept intentionally empty of product-specific domains: products register their own
 * doc types (and domains) via Liquibase seeds or runtime APIs.
 */
public final class DomainCatalog {

    private DomainCatalog() {}

    public record Domain(String key, String label) {}

    /** Platform-owned domains only (none today). Product domains come from seeded doc types. */
    public static List<Domain> v1() {
        return List.of();
    }
}
