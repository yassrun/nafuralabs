package ma.nafura.catalogue.service;

import java.text.Normalizer;
import java.util.Locale;
import java.util.regex.Pattern;

public final class CatalogSlug {

    private static final Pattern NON_LATIN = Pattern.compile("[^a-z0-9]+");

    private CatalogSlug() {}

    public static String from(String libelle) {
        if (libelle == null || libelle.isBlank()) {
            throw new IllegalArgumentException("catalogue.slug.libelle_requis");
        }
        String n = Normalizer.normalize(libelle.trim(), Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .toLowerCase(Locale.ROOT);
        String slug = NON_LATIN.matcher(n).replaceAll("-");
        slug = slug.replaceAll("^-+|-+$", "");
        if (slug.isBlank()) {
            throw new IllegalArgumentException("catalogue.slug.invalide");
        }
        if (slug.length() > 120) {
            slug = slug.substring(0, 120).replaceAll("-+$", "");
        }
        return slug;
    }
}
