package ma.nafura.platform.documents.docextractor.domain.model.catalog;

import java.util.List;

/**
 * Canonical domain catalog (V1) for Doc-Extractor.
 * <p>
 * This is intentionally code-only (no DB table) to keep seeds/UI filters aligned without schema changes.
 */
public final class DomainCatalog {

    private DomainCatalog() {}

    public record Domain(String key, String label) {}

    /**
     * V1 supported domains (canonical keys).
     * - finance: Accounting & Finance
     * - btp: Construction / BTP
     * - logistic: Logistics
     * - inventory: Inventory
     */
    public static List<Domain> v1() {
        return List.of(
                new Domain("finance", "Accounting & Finance"),
                new Domain("btp", "Construction / BTP"),
                new Domain("logistic", "Logistics"),
                new Domain("inventory", "Inventory")
        );
    }
}

