package ma.nafura.platform.framework.listing;

import java.util.Locale;

public enum ListingScope {
    ALL("all"),
    MINE("mine"),
    ARCHIVED("archived");

    private final String wireName;

    ListingScope(String wireName) {
        this.wireName = wireName;
    }

    public String wireName() {
        return wireName;
    }

    public static ListingScope fromWire(String raw) {
        if (raw == null || raw.isBlank()) {
            return ALL;
        }
        String normalized = raw.trim().toLowerCase(Locale.ROOT);
        for (ListingScope scope : values()) {
            if (scope.wireName.equals(normalized)) {
                return scope;
            }
        }
        throw new ListingQueryException("Unknown listing scope: " + raw);
    }
}
