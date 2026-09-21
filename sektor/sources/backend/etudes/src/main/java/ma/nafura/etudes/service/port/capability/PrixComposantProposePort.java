package ma.nafura.etudes.service.port.capability;

import java.math.BigDecimal;
import java.util.Optional;

/**
 * Estimation de prix unitaire HT (MAD) hors catalogue.
 * Ne résout jamais un item — c'est le rôle de {@code PrixComposantProposeService}.
 */
public interface PrixComposantProposePort {

    boolean isAvailable();

    Optional<Estimation> estimer(Contexte contexte);

    record Contexte(
            String designation,
            String type,
            String unite,
            String articleLibelle,
            String articleCode,
            String objetMarche,
            String ville,
            String typeAo) {}

    record Estimation(
            BigDecimal prixUnitaire,
            String unite,
            double confiance,
            String justification) {}
}
