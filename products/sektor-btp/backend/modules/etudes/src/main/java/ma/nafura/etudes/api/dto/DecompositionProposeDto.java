package ma.nafura.etudes.api.dto;

import java.math.BigDecimal;
import java.util.List;
import lombok.Builder;

/**
 * Suggestion de décomposition non persistée — résultat du rapprochement catalogue.
 */
@Builder
public record DecompositionProposeDto(
        List<ComposantMatchedDto> matched,
        List<ComposantMissingDto> missing,
        Double confiance) {

    @Builder
    public record ComposantMatchedDto(
            String type,
            String itemId,
            String code,
            String name,
            String unite,
            BigDecimal rendement,
            BigDecimal prixUnitaire,
            String sourcePrix,
            Double confiance,
            boolean suggereParIa) {}

    @Builder
    public record ComposantMissingDto(
            String type,
            String designation,
            String unite,
            BigDecimal rendement,
            Double confiance,
            String raison) {}
}
