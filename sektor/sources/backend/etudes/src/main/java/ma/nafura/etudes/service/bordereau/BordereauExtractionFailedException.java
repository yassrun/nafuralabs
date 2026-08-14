package ma.nafura.etudes.service.bordereau;

/**
 * Échec d'extraction portant les diagnostics de <em>cet</em> appel — plus de champ singleton.
 */
public class BordereauExtractionFailedException extends IllegalStateException {

    private final BordereauExtractionDiagnostics diagnostics;

    public BordereauExtractionFailedException(String message, BordereauExtractionDiagnostics diagnostics) {
        super(message);
        this.diagnostics = diagnostics == null ? BordereauExtractionDiagnostics.empty() : diagnostics;
    }

    public BordereauExtractionDiagnostics diagnostics() {
        return diagnostics;
    }
}
