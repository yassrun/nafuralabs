package ma.nafura.platform.collaboration.docmanager.template;

import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Turns tenant-authored text into a Thymeleaf-safe fragment.
 *
 * <p>Administrators write plain text with {@code {{tenant.ice}}} placeholders inserted by a
 * button, never an expression. Each token is checked against a closed list and rewritten as a
 * {@code th:text} span; everything else is HTML-escaped. Nothing a tenant types is ever evaluated
 * as an expression, which is what keeps the customisation screen out of reach of the template
 * engine.
 */
public final class DocumentTokenResolver {

    private static final Pattern TOKEN = Pattern.compile("\\{\\{\\s*([a-zA-Z0-9_.]+)\\s*}}");

    /**
     * Paths a tenant may insert. Deliberately narrow: identity, document heading and totals.
     * Anything outside is rendered as literal text so a typo is visible rather than silent.
     */
    private static final Set<String> ALLOWED = Set.of(
            "tenant.raisonSociale",
            "tenant.formeJuridique",
            "tenant.capital",
            "tenant.ice",
            "tenant.identifiantFiscal",
            "tenant.rc",
            "tenant.patente",
            "tenant.cnss",
            "tenant.tvaIntra",
            "tenant.adresse",
            "tenant.ville",
            "tenant.telephone",
            "tenant.email",
            "tenant.siteWeb",
            "tenant.banque",
            "tenant.rib",
            "document.libelleType",
            "document.numero",
            "document.reference",
            "document.objet",
            "document.client.raisonSociale",
            "document.client.ice",
            "document.totaux.ht",
            "document.totaux.tva",
            "document.totaux.ttc",
            "document.totaux.enLettres",
            "today");

    private DocumentTokenResolver() {}

    public static Set<String> allowedTokens() {
        return ALLOWED;
    }

    /**
     * @param text plain text with {@code {{token}}} placeholders
     * @return HTML where allowed tokens became th:text spans and everything else is escaped
     */
    public static String toFragmentHtml(String text) {
        if (text == null || text.isBlank()) {
            return "";
        }
        StringBuilder out = new StringBuilder();
        Matcher matcher = TOKEN.matcher(text);
        int cursor = 0;
        while (matcher.find()) {
            out.append(escape(text.substring(cursor, matcher.start())));
            String path = matcher.group(1);
            if (ALLOWED.contains(path)) {
                out.append("<span th:text=\"${").append(path).append("}\"></span>");
            } else {
                // Unknown token stays visible as text: a typo must be obvious in the preview,
                // not silently swallowed.
                out.append(escape(matcher.group(0)));
            }
            cursor = matcher.end();
        }
        out.append(escape(text.substring(cursor)));
        return out.toString().replace("\n", "<br/>");
    }

    /** Tokens used in the text that are not on the allow-list, for a preview warning. */
    public static Set<String> unknownTokens(String text) {
        Set<String> unknown = new LinkedHashSet<>();
        if (text == null) {
            return unknown;
        }
        Matcher matcher = TOKEN.matcher(text);
        while (matcher.find()) {
            if (!ALLOWED.contains(matcher.group(1))) {
                unknown.add(matcher.group(1));
            }
        }
        return unknown;
    }

    /**
     * Escape for HTML text content. Also neutralises {@code $} and {@code #} followed by a brace,
     * so text that happens to look like an expression is printed rather than evaluated.
     */
    static String escape(String raw) {
        StringBuilder sb = new StringBuilder(raw.length());
        for (int i = 0; i < raw.length(); i++) {
            char c = raw.charAt(i);
            switch (c) {
                case '&' -> sb.append("&amp;");
                case '<' -> sb.append("&lt;");
                case '>' -> sb.append("&gt;");
                case '"' -> sb.append("&quot;");
                case '\'' -> sb.append("&#39;");
                case '$', '#', '*', '@', '~' -> {
                    boolean opensExpression = i + 1 < raw.length() && raw.charAt(i + 1) == '{';
                    sb.append(opensExpression ? "&#" + (int) c + ";" : String.valueOf(c));
                }
                default -> sb.append(c);
            }
        }
        return sb.toString();
    }

    /** A CSS colour the tenant picked, constrained to a hex literal. */
    public static String safeColor(String value, String fallback) {
        if (value != null && value.matches("#[0-9a-fA-F]{3,8}")) {
            return value.toLowerCase(Locale.ROOT);
        }
        return fallback;
    }
}
