package ma.nafura.catalogue.service;

/**
 * Raised when a stock exit would drive available quantity below zero
 * while the active costing method disallows negative stock.
 */
public class InsufficientStockException extends IllegalStateException {

    public InsufficientStockException(String message) {
        super(message);
    }
}
