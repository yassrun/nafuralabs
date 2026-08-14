package ma.nafura.platform.collaboration.docmanager.template;

import java.net.URI;
import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Rejects documents that would make the renderer fetch something over the network.
 *
 * <p>A browser-based PDF renderer follows every {@code src}, {@code href} and {@code url()} in the
 * page. Left open, a template becomes a way to reach internal services from inside the cluster, or
 * to leak document contents to a third party through a crafted URL. Assets must therefore be
 * inlined (the logo already is, as a data URI) and anything remote is refused before rendering.
 */
public final class HtmlOutboundGuard {

    private static final Pattern URL_ATTRIBUTE = Pattern.compile(
            "(?i)\\b(?:src|href|data|poster|action|formaction)\\s*=\\s*[\"']([^\"']*)[\"']");
    private static final Pattern CSS_URL = Pattern.compile("(?i)url\\(\\s*[\"']?([^\"')]*)[\"']?\\s*\\)");
    private static final Pattern IMPORT_RULE = Pattern.compile("(?i)@import\\s+[\"']([^\"']*)[\"']");

    /** Schemes that never leave the document. */
    private static final Set<String> INLINE_SCHEMES = Set.of("data", "cid");

    private HtmlOutboundGuard() {}

    /**
     * @return every remote reference found, empty when the document is self-contained
     */
    public static Set<String> findRemoteReferences(String html) {
        Set<String> remote = new LinkedHashSet<>();
        if (html == null || html.isBlank()) {
            return remote;
        }
        collect(URL_ATTRIBUTE.matcher(html), remote);
        collect(CSS_URL.matcher(html), remote);
        collect(IMPORT_RULE.matcher(html), remote);
        return remote;
    }

    /**
     * @throws TemplateRenderException when the document references anything remote
     */
    public static void requireSelfContained(String html) {
        Set<String> remote = findRemoteReferences(html);
        if (!remote.isEmpty()) {
            throw new TemplateRenderException(
                    "Le document référence des ressources externes, interdites au rendu : "
                            + String.join(", ", remote)
                            + ". Intégrez les images en data URI et le CSS dans le document.");
        }
    }

    private static void collect(Matcher matcher, Set<String> remote) {
        while (matcher.find()) {
            String reference = matcher.group(1);
            if (isRemote(reference)) {
                remote.add(reference.length() > 120 ? reference.substring(0, 120) + "…" : reference);
            }
        }
    }

    private static boolean isRemote(String reference) {
        if (reference == null) {
            return false;
        }
        String value = reference.trim();
        if (value.isEmpty() || value.startsWith("#")) {
            return false;
        }
        // Unresolved Thymeleaf expressions are evaluated before this check runs; anything left
        // here is literal.
        String lower = value.toLowerCase(Locale.ROOT);
        for (String scheme : INLINE_SCHEMES) {
            if (lower.startsWith(scheme + ":")) {
                return false;
            }
        }
        // Protocol-relative (//host/x) and absolute URLs are remote; so is any explicit scheme.
        if (lower.startsWith("//")) {
            return true;
        }
        try {
            URI uri = URI.create(value);
            if (uri.getScheme() == null) {
                // Relative path: nothing to serve it from, the renderer gets a standalone
                // document, so it resolves to nothing. Treat as remote to fail loudly.
                return !value.startsWith("#");
            }
            return true;
        } catch (IllegalArgumentException e) {
            // Not parseable as a URI: it cannot be fetched either.
            return false;
        }
    }
}
