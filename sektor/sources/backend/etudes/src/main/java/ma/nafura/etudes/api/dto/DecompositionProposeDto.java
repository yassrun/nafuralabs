package ma.nafura.etudes.api.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import lombok.Builder;

/**
 * Suggestion de décomposition non persistée — identité Extraire (deux seaux).
 */
@Builder
public record DecompositionProposeDto(
        List<ComposantMatchedDto> matched,
        List<ComposantMissingDto> missing,
        List<ComposantIncertainDto> uncertain,
        Double confiance) {

    @Builder
    public record ComposantMatchedDto(
            String type,
            String itemId,
            String cleStable,
            String code,
            String name,
            String unite,
            BigDecimal rendement,
            BigDecimal prixUnitaire,
            String sourcePrix,
            UUID prixSourceRefId,
            LocalDate prixDateSource,
            UUID prixCurrencyId,
            String prixLibelleSource,
            Double confiance,
            boolean suggereParIa) {}

    @Builder
    public record ComposantMissingDto(
            String type,
            String designation,
            String cleStable,
            String unite,
            BigDecimal rendement,
            Double confiance,
            String raison) {}

    @Builder
    public record ComposantIncertainDto(
            String type,
            String designation,
            String unite,
            BigDecimal rendement,
            Double confiance,
            List<String> identitesCandidates) {}
}
