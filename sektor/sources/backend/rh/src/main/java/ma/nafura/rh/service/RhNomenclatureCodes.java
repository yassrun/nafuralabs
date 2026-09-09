package ma.nafura.rh.service;

import java.text.Normalizer;
import java.util.Locale;
import java.util.UUID;
import java.util.regex.Pattern;
import org.springframework.util.StringUtils;

public final class RhNomenclatureCodes {

    private static final Pattern NON_CODE = Pattern.compile("[^A-Z0-9]+");

    private RhNomenclatureCodes() {}

    public static String slug(String libelle, String fallbackPrefix, int next) {
        String raw = libelle == null ? "" : libelle.trim();
        raw = Normalizer.normalize(raw, Normalizer.Form.NFD).replaceAll("\\p{M}+", "");
        raw = raw.toUpperCase(Locale.ROOT);
        String slug = NON_CODE.matcher(raw).replaceAll("-");
        slug = slug.replaceAll("^-+", "").replaceAll("-+$", "");
        if (!StringUtils.hasText(slug) || slug.length() > 50) {
            return fallbackPrefix + String.format(Locale.ROOT, "%03d", next);
        }
        return slug.length() > 50 ? slug.substring(0, 50) : slug;
    }

    static String nextId(String prefix, int max) {
        return String.format(Locale.ROOT, "%s-%03d", prefix, max + 1);
    }

    static UUID tenantId() {
        return ma.nafura.platform.framework.context.TenantContext.getTenantId();
    }
}
