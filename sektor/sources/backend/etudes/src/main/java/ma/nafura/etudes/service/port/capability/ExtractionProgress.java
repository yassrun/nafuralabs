package ma.nafura.etudes.service.port.capability;

/**
 * Callback de progression pour les extractions longues (vision page/page).
 * {@code percent} est dans {@code [0, 100]} ; {@code step} est un libellé UI.
 */
@FunctionalInterface
public interface ExtractionProgress {

    void report(int percent, String step);

    static ExtractionProgress noop() {
        return (percent, step) -> {
        };
    }
}
