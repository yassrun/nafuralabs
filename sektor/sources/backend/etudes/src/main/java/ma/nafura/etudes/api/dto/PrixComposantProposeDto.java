package ma.nafura.etudes.api.dto;

import java.math.BigDecimal;
import lombok.Builder;

/** Proposition non persistée — le chargé accepte avant d’écrire le PU. */
@Builder
public record PrixComposantProposeDto(
        BigDecimal prixUnitaire,
        String unite,
        String sourcePrix,
        String libelleSource,
        Double confiance,
        boolean aVerifier,
        String justification) {}
