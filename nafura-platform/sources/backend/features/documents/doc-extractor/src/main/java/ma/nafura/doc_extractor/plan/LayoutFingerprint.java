package ma.nafura.platform.documents.docextractor.plan;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;
import ma.nafura.platform.documents.docextractor.grid.GridRow;

/**
 * Empreinte de trame — structure, pas le contenu métier.
 * Jamais partagée entre tenants (O1).
 */
public final class LayoutFingerprint {

    private LayoutFingerprint() {}

    public static String of(List<GridRow> rows) {
        if (rows == null || rows.isEmpty()) {
            return "empty";
        }
        int columns = rows.stream().mapToInt(r -> r.cells().size()).max().orElse(0);
        GridRow header = rows.get(0);
        String headers = header.cells().stream()
                .map(c -> c == null ? "" : c.trim().toUpperCase(Locale.ROOT))
                .collect(Collectors.joining("|"));
        String raw = columns + "\n" + headers;
        return sha256(raw);
    }

    public static String cacheKey(String tenantId, String fingerprint) {
        String tenant = tenantId == null || tenantId.isBlank() ? "_" : tenantId;
        return tenant + "\u0000" + fingerprint;
    }

    private static String sha256(String raw) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(raw.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            return Integer.toHexString(raw.hashCode());
        }
    }
}
