package ma.nafura.platform.collaboration.docmanager.template;

/**
 * Thrown when template rendering or PDF generation fails.
 */
public class TemplateRenderException extends RuntimeException {

    public TemplateRenderException(String message) {
        super(message);
    }

    public TemplateRenderException(String message, Throwable cause) {
        super(message, cause);
    }
}
