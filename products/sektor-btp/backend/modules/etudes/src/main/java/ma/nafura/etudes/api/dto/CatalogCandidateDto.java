package ma.nafura.etudes.api.dto;

import lombok.Builder;

/** Candidat catalogue pour résolution de désignation (lot 1 T1.7). */
@Builder
public record CatalogCandidateDto(
        String itemId,
        String code,
        String name,
        String unite,
        String nature,
        Double score) {}
