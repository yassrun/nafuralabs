package ma.nafura.platform.integrations.googleplaces;

public class GooglePlacesException extends RuntimeException {

    private final int statusCode;
    private final boolean retryable;

    public GooglePlacesException(String message, int statusCode, boolean retryable) {
        super(message);
        this.statusCode = statusCode;
        this.retryable = retryable;
    }

    public GooglePlacesException(String message, Throwable cause) {
        super(message, cause);
        this.statusCode = 0;
        this.retryable = true;
    }

    public int getStatusCode() {
        return statusCode;
    }

    public boolean isRetryable() {
        return retryable;
    }
}
