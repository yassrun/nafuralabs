package ma.nafura.consultation.api.dto;

import lombok.Builder;

/**
 * A catalog item proposed as a match for a designation during resolution.
 */
@Builder
public record CatalogCandidateDto(
        String itemId,
        String code,
        String name,
        String unite,
        String articleType,
        Double score) {
}
