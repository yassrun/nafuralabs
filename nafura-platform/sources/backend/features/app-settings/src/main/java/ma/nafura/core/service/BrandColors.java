package ma.nafura.platform.appsettings.service;

import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * Resolved org brand colours for templates ({@code brand.primary|secondary|accent}).
 */
public record BrandColors(String primary, String secondary, String accent) {

    public static final String DEFAULT_PRIMARY = "#1d4ed8";
    public static final String DEFAULT_SECONDARY = "#64748b";
    public static final String DEFAULT_ACCENT = "#0f172a";

    private static final Pattern HEX = Pattern.compile("#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?");

    public static BrandColors defaults() {
        return new BrandColors(DEFAULT_PRIMARY, DEFAULT_SECONDARY, DEFAULT_ACCENT);
    }

    public static BrandColors of(String primary, String secondary, String accent) {
        return new BrandColors(
            normalize(primary, DEFAULT_PRIMARY),
            normalize(secondary, DEFAULT_SECONDARY),
            normalize(accent, DEFAULT_ACCENT));
    }

    public Map<String, Object> asTemplateMap() {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("primary", primary);
        map.put("secondary", secondary);
        map.put("accent", accent);
        return map;
    }

    /** Normalize to lowercase {@code #rrggbb}, or {@code fallback} if invalid. */
    public static String normalize(String value, String fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }
        String v = value.trim();
        if (!v.startsWith("#")) {
            v = "#" + v;
        }
        if (!HEX.matcher(v).matches()) {
            return fallback;
        }
        String h = v.substring(1);
        if (h.length() == 3) {
            h = "" + h.charAt(0) + h.charAt(0) + h.charAt(1) + h.charAt(1) + h.charAt(2) + h.charAt(2);
        }
        return ("#" + h).toLowerCase(Locale.ROOT);
    }

    /** Null if invalid (for persistence: store only valid hex). */
    public static String normalizeOrNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String normalized = normalize(value, "");
        return normalized.isBlank() ? null : normalized;
    }
}
