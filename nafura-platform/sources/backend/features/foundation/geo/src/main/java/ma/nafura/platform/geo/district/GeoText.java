package ma.nafura.platform.geo.district;

import java.text.Normalizer;
import java.util.Locale;

final class GeoText {

    private GeoText() {}

    static String normalizeCity(String cityCode) {
        if (cityCode == null) {
            return "";
        }
        return stripAccents(cityCode.trim().toLowerCase(Locale.ROOT)).replace(' ', '-');
    }

    static String normalizeAlias(String value) {
        if (value == null) {
            return "";
        }
        return stripAccents(value.toLowerCase(Locale.ROOT))
                .replace('-', ' ')
                .replaceAll("\\s+", " ")
                .trim();
    }

    private static String stripAccents(String input) {
        String normalized = Normalizer.normalize(input, Normalizer.Form.NFD);
        return normalized.replaceAll("\\p{M}+", "");
    }
}
