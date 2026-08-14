package ma.nafura.platform.framework.service.crud;

/**
 * Base exception type for CRUD operations.
 */
public class CrudException extends RuntimeException {
    public CrudException(String message) {
        super(message);
    }

    public CrudException(String message, Throwable cause) {
        super(message, cause);
    }
}


