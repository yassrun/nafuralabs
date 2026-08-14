package ma.nafura.catalogue.service.prix;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Candidat de prix provenant d'une source externe (achats).
 * Le {@code sourcePrix} utilise les constantes de {@link ma.nafura.catalogue.domain.article.SourcePrix}.
 */
public record PrixCandidat(
        BigDecimal prixUnitaire,
        String sourcePrix,
        UUID sourceRefId,
        LocalDate dateSource,
        UUID currencyId,
        String libelleSource,
        boolean perime) {

    public PrixResolu toResolu() {
        return new PrixResolu(
                prixUnitaire, sourcePrix, sourceRefId, dateSource, currencyId, libelleSource, perime);
    }
}
