package ma.nafura.platform.collaboration.docmanager.api.response;

import ma.nafura.platform.collaboration.docmanager.template.TemplateRenderException;

/**
 * A template failure the author can act on: what went wrong, and where.
 *
 * @param message    human-readable cause, already unwrapped to the deepest one
 * @param line       1-based line in the template body, when known
 * @param column     1-based column, when known
 * @param expression the offending expression, when Thymeleaf reported it
 * @param phase      PARSE | EXPRESSION | PDF — PDF means the backend failed, not the author
 */
public record TemplateRenderError(
        String message, Integer line, Integer column, String expression, String phase) {

    public static TemplateRenderError from(TemplateRenderException e) {
        return new TemplateRenderError(
                e.getMessage(), e.getLine(), e.getColumn(), e.getExpression(), e.getPhase().name());
    }
}
