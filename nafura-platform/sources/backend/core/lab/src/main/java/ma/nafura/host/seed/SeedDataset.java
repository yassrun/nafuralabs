package ma.nafura.host.seed;

import java.util.List;
import java.util.Map;

/**
 * A data set a business context ships in {@code META-INF/nafura/seed/*.json}: records created in every organization
 * of the product. {@code reference} data goes everywhere, prod included; {@code demo} data only where demo data is
 * on (lab, staging). Records are matched by {@code key}: an existing one is never touched.
 */
public record SeedDataset(String id, Kind kind, Scope scope, List<String> after, List<Block> entities, String source, String checksum) {

    public enum Kind { REFERENCE, DEMO }

    /** Organization: copied into each organization. Product: one read-only set for the whole product. */
    public enum Scope { ORGANIZATION, PRODUCT }

    /**
     * Records of one entity (JPA entity name). A field may reference another record:
     * {@code { "$ref": "DemoCategory", "code": "IT" }}; {@code "$transitions": ["submit"]} fires lifecycle transitions
     * after creation, as a user would.
     */
    public record Block(String entity, List<String> key, List<Map<String, Object>> records) {
    }
}
