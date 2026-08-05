package ma.nafura.platform.collaboration.docmanager.template;

import org.thymeleaf.exceptions.TemplateProcessingException;

/**
 * Thrown when template rendering or PDF generation fails.
 *
 * <p>Carries the position Thymeleaf reports so the editor can point at the offending line
 * instead of showing a generic failure toast.
 */
public class TemplateRenderException extends RuntimeException {

    /** Where the failure happened, so the API can distinguish an author mistake from an outage. */
    public enum Phase {
        /** Malformed markup or unparsable expression. */
        PARSE,
        /** Expression evaluated but failed (unknown variable, bad property…). */
        EXPRESSION,
        /** Markup was fine; the PDF renderer failed. */
        PDF
    }

    private final Phase phase;
    private final Integer line;
    private final Integer column;
    private final String expression;

    public TemplateRenderException(String message) {
        this(message, null, Phase.PARSE, null, null, null);
    }

    public TemplateRenderException(String message, Throwable cause) {
        this(message, cause, Phase.PARSE, null, null, null);
    }

    public TemplateRenderException(
            String message, Throwable cause, Phase phase, Integer line, Integer column, String expression) {
        super(message, cause);
        this.phase = phase != null ? phase : Phase.PARSE;
        this.line = line;
        this.column = column;
        this.expression = expression;
    }

    /** PDF backend failure: not the template author's fault. */
    public static TemplateRenderException pdf(String message, Throwable cause) {
        return new TemplateRenderException(message, cause, Phase.PDF, null, null, null);
    }

    /**
     * Map a Thymeleaf failure, keeping line/column and the deepest cause message — the outer
     * message is boilerplate, the useful text is at the bottom of the chain.
     */
    public static TemplateRenderException from(TemplateProcessingException e) {
        Integer line = e.getLine();
        Integer column = e.getCol();
        Throwable root = e;
        while (root.getCause() != null && root.getCause() != root) {
            root = root.getCause();
        }
        String message = root.getMessage() != null ? root.getMessage() : e.getMessage();
        Phase phase = (line != null || column != null) ? Phase.EXPRESSION : Phase.PARSE;
        return new TemplateRenderException(message, e, phase, line, column, extractExpression(e));
    }

    /** Thymeleaf embeds the offending expression in its message as (template: "…" - line n, col n). */
    private static String extractExpression(TemplateProcessingException e) {
        String message = e.getMessage();
        if (message == null) {
            return null;
        }
        int start = message.indexOf('"');
        int end = message.indexOf('"', start + 1);
        return (start >= 0 && end > start) ? message.substring(start + 1, end) : null;
    }

    public Phase getPhase() {
        return phase;
    }

    public Integer getLine() {
        return line;
    }

    public Integer getColumn() {
        return column;
    }

    public String getExpression() {
        return expression;
    }
}
