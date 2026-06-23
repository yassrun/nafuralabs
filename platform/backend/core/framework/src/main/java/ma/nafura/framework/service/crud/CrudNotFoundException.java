package ma.nafura.platform.framework.service.crud;

/**
 * Thrown when an entity is not found for the current tenant.
 */
public class CrudNotFoundException extends CrudException {
    public CrudNotFoundException(String message) {
        super(message);
    }
}


