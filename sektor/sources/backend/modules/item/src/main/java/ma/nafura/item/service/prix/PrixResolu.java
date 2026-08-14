package ma.nafura.item.service.prix;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Prix d'achat résolu avec traçabilité de source.
 */
public record PrixResolu(
        BigDecimal prixUnitaire,
        String sourcePrix,
        UUID sourceRefId,
        LocalDate dateSource,
        UUID currencyId,
        String libelleSource,
        boolean perime) {}
