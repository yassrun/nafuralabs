package ma.nafura.catalogue.service.prix;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Contexte de résolution d'un prix d'achat à une date d'étude.
 */
public record ContexteResolution(
        UUID tenantId,
        LocalDate dateReference,
        UUID fournisseurPrefereId,
        UUID chantierId,
        UUID devisePivotId,
        String basePrixChiffrage) {

    public ContexteResolution {
        if (dateReference == null) {
            dateReference = LocalDate.now();
        }
        basePrixChiffrage = ma.nafura.catalogue.domain.BasePrixChiffrage.normalize(basePrixChiffrage);
    }

    public static ContexteResolution of(UUID tenantId, LocalDate dateReference, UUID devisePivotId) {
        return new ContexteResolution(tenantId, dateReference, null, null, devisePivotId, null);
    }
}
