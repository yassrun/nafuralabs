package ma.nafura.platform.collaboration.notification.service;

/**
 * Exception thrown when email sending fails.
 */
public class EmailException extends RuntimeException {
    
    public EmailException(String message) {
        super(message);
    }
    
    public EmailException(String message, Throwable cause) {
        super(message, cause);
    }
}

