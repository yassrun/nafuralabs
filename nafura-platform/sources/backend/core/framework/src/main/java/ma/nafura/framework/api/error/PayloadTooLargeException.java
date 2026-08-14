package ma.nafura.platform.framework.api.error;

/**
 * Raised when an uploaded payload exceeds a configured or upstream size limit
 * (e.g. Spring multipart max, or object-storage ingress returning HTTP 413).
 */
public class PayloadTooLargeException extends RuntimeException {

    public PayloadTooLargeException(String message) {
        super(message);
    }

    public PayloadTooLargeException(String message, Throwable cause) {
        super(message, cause);
    }
}
