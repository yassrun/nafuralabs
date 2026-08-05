package ma.nafura.platform.collaboration.docmanager.template;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Spells an amount in French, as required on invoices ("arrêtée la présente facture à la somme
 * de …"). Server-side on purpose: this is a legal mention, not a formatting choice to be
 * reimplemented in every template.
 *
 * <p>French (not Belgian/Swiss) numbering, with the agreement rules that actually bite on
 * printed documents:
 * <ul>
 *   <li>{@code vingt} and {@code cent} take an -s when multiplied <em>and</em> nothing follows:
 *       "quatre-vingts", "deux cents" — but "quatre-vingt mille", "deux cent mille".</li>
 *   <li>{@code mille} is invariable and never preceded by "un".</li>
 *   <li>{@code million}/{@code milliard} are nouns: they take an -s and call for "de" when they
 *       end the number — "deux millions de dirhams", but "un million cinq cent mille dirhams".</li>
 * </ul>
 */
public final class AmountInWords {

    private static final String[] UNITS = {
        "zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf",
        "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize"
    };

    private static final String[] TENS = {
        "", "", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante", "quatre-vingt",
        "quatre-vingt"
    };

    private static final long MILLION = 1_000_000L;

    private AmountInWords() {}

    /**
     * @param amount   amount to spell; rounded to 2 decimals (half-up)
     * @param currency currency word in singular, e.g. "dirham"; null falls back to "dirham"
     * @param cents    subunit word in singular, e.g. "centime"; null falls back to "centime"
     * @return e.g. "cent vingt mille dirhams et cinquante centimes"; empty string if amount null
     */
    public static String spell(BigDecimal amount, String currency, String cents) {
        if (amount == null) {
            return "";
        }
        String unit = currency != null && !currency.isBlank() ? currency : "dirham";
        String sub = cents != null && !cents.isBlank() ? cents : "centime";

        BigDecimal rounded = amount.setScale(2, RoundingMode.HALF_UP);
        boolean negative = rounded.signum() < 0;
        rounded = rounded.abs();

        long whole = rounded.longValue();
        int fraction = rounded.subtract(BigDecimal.valueOf(whole))
                .movePointRight(2)
                .setScale(0, RoundingMode.HALF_UP)
                .intValue();

        StringBuilder sb = new StringBuilder();
        if (negative) {
            sb.append("moins ");
        }
        sb.append(spellInteger(whole, true))
                .append(needsDe(whole) ? " de " : " ")
                .append(plural(unit, whole));
        if (fraction > 0) {
            sb.append(" et ")
                    .append(spellInteger(fraction, true))
                    .append(' ')
                    .append(plural(sub, fraction));
        }
        return sb.toString();
    }

    /** Convenience for Moroccan dirhams, the default of this ERP. */
    public static String spellDirhams(BigDecimal amount) {
        return spell(amount, "dirham", "centime");
    }

    /** "deux millions <em>de</em> dirhams", but "deux millions cinq cent mille dirhams". */
    private static boolean needsDe(long whole) {
        return whole >= MILLION && whole % MILLION == 0;
    }

    private static String plural(String word, long count) {
        return count > 1 ? word + "s" : word;
    }

    /**
     * @param standalone true when nothing follows this number; drives the -s of vingt/cent
     */
    private static String spellInteger(long n, boolean standalone) {
        if (n < 0) {
            return "moins " + spellInteger(-n, standalone);
        }
        if (n < 17) {
            return UNITS[(int) n];
        }
        if (n < 100) {
            return spellTens((int) n, standalone);
        }
        if (n < 1000) {
            return spellHundreds((int) n, standalone);
        }
        if (n < MILLION) {
            return spellScale(n, 1000, "mille", "mille");
        }
        if (n < 1_000_000_000L) {
            return spellScale(n, MILLION, "million", "millions");
        }
        return spellScale(n, 1_000_000_000L, "milliard", "milliards");
    }

    private static String spellTens(int n, boolean standalone) {
        int tens = n / 10;
        int unit = n % 10;

        // 17-19: UNITS stops at seize, the rest is built on dix.
        if (tens == 1) {
            return "dix-" + UNITS[unit];
        }
        // 70-79 and 90-99 are built on soixante/quatre-vingt plus 10..19.
        if (tens == 7 || tens == 9) {
            int remainder = n - (tens == 7 ? 60 : 80);
            String joiner = (tens == 7 && remainder == 11) ? " et " : "-";
            return TENS[tens] + joiner + spellInteger(remainder, true);
        }
        if (unit == 0) {
            return (tens == 8 && standalone) ? TENS[tens] + "s" : TENS[tens];
        }
        // 21, 31 … 61 use "et un"; 81 does not.
        if (unit == 1 && tens != 8) {
            return TENS[tens] + " et un";
        }
        return TENS[tens] + "-" + UNITS[unit];
    }

    private static String spellHundreds(int n, boolean standalone) {
        int hundreds = n / 100;
        int remainder = n % 100;
        String prefix = hundreds == 1 ? "cent" : UNITS[hundreds] + " cent";
        if (remainder == 0) {
            return (hundreds > 1 && standalone) ? prefix + "s" : prefix;
        }
        return prefix + " " + spellInteger(remainder, standalone);
    }

    private static String spellScale(long n, long scale, String singular, String plural) {
        long count = n / scale;
        long remainder = n % scale;
        // The multiplier is followed by the scale word, so vingt/cent stay invariable there.
        String head = (count == 1)
                ? (scale == 1000 ? singular : "un " + singular)
                : spellInteger(count, false) + " " + (scale == 1000 ? singular : plural);
        return remainder == 0 ? head : head + " " + spellInteger(remainder, true);
    }
}
