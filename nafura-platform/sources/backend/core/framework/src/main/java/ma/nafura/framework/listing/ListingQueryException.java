package ma.nafura.platform.framework.listing;

/**
 * Invalid listing query parameters (filter syntax, operator, scope, etc.).
 */
public class ListingQueryException extends IllegalArgumentException {

    public ListingQueryException(String message) {
        super(message);
    }
}
