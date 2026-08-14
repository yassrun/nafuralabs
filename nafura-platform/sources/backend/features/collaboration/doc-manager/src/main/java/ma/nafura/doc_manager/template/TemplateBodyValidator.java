package ma.nafura.platform.collaboration.docmanager.template;

import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Refuses template bodies that could do more than lay out a document.
 *
 * <p>Thymeleaf evaluates expressions in SpringEL, which reaches the whole JVM: {@code
 * ${T(java.lang.Runtime).getRuntime().exec(...)}} is remote code execution, and {@code @beanName}
 * reaches any bean in the context. Since template bodies live in a multi-tenant database, that
 * turns a template into an execution vector.
 *
 * <p>A deny-list is not a sandbox, and this class does not pretend to be one — it is the second
 * line. The first is that tenants no longer write template bodies at all: they use the
 * customisation screen, whose text goes through {@link DocumentTokenResolver} and is never
 * evaluated. This validator guards the remaining path, where a support account edits a body.
 */
public final class TemplateBodyValidator {

    /** Patterns that have no legitimate use in a document layout. */
    private static final Pattern[] FORBIDDEN = {
        // Type references: T(java.lang.Runtime), T(java.lang.System)
        Pattern.compile("(?i)\\bT\\s*\\("),
        // Instantiation: new java.io.File(...)
        Pattern.compile("(?i)\\bnew\\s+[a-zA-Z_$][\\w$]*(\\s*\\.\\s*[a-zA-Z_$][\\w$]*)*\\s*\\("),
        // Bean references: ${@someBean.method()}
        Pattern.compile("[$*#]\\{\\s*@"),
        // Class navigation used to break out: ''.class.forName(...), .getClass(), .classLoader
        Pattern.compile("(?i)\\.\\s*(class|getClass\\s*\\(|classLoader|forName\\s*\\()"),
        // Reflection and process helpers reachable through property navigation
        Pattern.compile("(?i)\\b(getRuntime|exec|ProcessBuilder|Unsafe|invoke|newInstance)\\s*\\("),
        // Server-side includes of arbitrary files
        Pattern.compile("(?i)\\bth:(replace|insert|include)\\s*=\\s*[\"'][^\"']*\\bfile:"),
    };

    /** Markup that turns a printed document into an active page. */
    private static final Pattern[] FORBIDDEN_MARKUP = {
        Pattern.compile("(?i)<\\s*script\\b"),
        Pattern.compile("(?i)<\\s*iframe\\b"),
        Pattern.compile("(?i)<\\s*object\\b"),
        Pattern.compile("(?i)<\\s*embed\\b"),
        // Inline event handlers: onclick=, onload=, onerror=
        Pattern.compile("(?i)\\son[a-z]+\\s*="),
        Pattern.compile("(?i)javascript\\s*:"),
    };

    private TemplateBodyValidator() {}

    /**
     * @throws TemplateRenderException when the body contains anything outside document layout
     */
    public static void validate(String templateBody) {
        Set<String> violations = findViolations(templateBody);
        if (!violations.isEmpty()) {
            throw new TemplateRenderException(
                    "Le modèle contient des éléments interdits : "
                            + String.join(", ", violations)
                            + ". Un modèle ne peut que mettre en forme un document.");
        }
    }

    /** @return human-readable descriptions of what was rejected, empty when the body is fine */
    public static Set<String> findViolations(String templateBody) {
        Set<String> violations = new LinkedHashSet<>();
        if (templateBody == null || templateBody.isBlank()) {
            return violations;
        }
        for (Pattern pattern : FORBIDDEN) {
            Matcher matcher = pattern.matcher(templateBody);
            if (matcher.find()) {
                violations.add(excerpt(matcher.group()));
            }
        }
        for (Pattern pattern : FORBIDDEN_MARKUP) {
            Matcher matcher = pattern.matcher(templateBody);
            if (matcher.find()) {
                violations.add(excerpt(matcher.group().trim()));
            }
        }
        return violations;
    }

    private static String excerpt(String match) {
        String normalised = match.replaceAll("\\s+", " ").trim().toLowerCase(Locale.ROOT);
        return normalised.length() > 40 ? normalised.substring(0, 40) + "…" : normalised;
    }
}
