package ma.nafura.platform.framework.service.crud;

/**
 * Thrown when a CRUD operation cannot be completed (e.g., unsupported merge).
 */
public class CrudOperationException extends CrudException {
    public CrudOperationException(String message) {
        super(message);
    }
}


