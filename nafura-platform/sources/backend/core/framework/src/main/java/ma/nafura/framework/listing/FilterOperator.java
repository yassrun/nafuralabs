package ma.nafura.platform.framework.listing;

public enum FilterOperator {
    EQ("eq"),
    NE("ne"),
    CONTAINS("contains"),
    STARTS_WITH("startsWith"),
    GT("gt"),
    GTE("gte"),
    LT("lt"),
    LTE("lte"),
    IN("in"),
    BETWEEN("between"),
    IS_EMPTY("isEmpty"),
    IS_NOT_EMPTY("isNotEmpty");

    private final String wireName;

    FilterOperator(String wireName) {
        this.wireName = wireName;
    }

    public String wireName() {
        return wireName;
    }

    public static FilterOperator fromWire(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new ListingQueryException("Filter operator is required");
        }
        String normalized = raw.trim();
        for (FilterOperator op : values()) {
            if (op.wireName.equals(normalized)) {
                return op;
            }
        }
        throw new ListingQueryException("Unknown filter operator: " + raw);
    }
}
