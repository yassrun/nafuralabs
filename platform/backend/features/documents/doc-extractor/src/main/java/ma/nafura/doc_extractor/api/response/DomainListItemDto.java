package ma.nafura.platform.documents.docextractor.api.response;

/**
 * Simple DTO for domain dropdowns/filters.
 */
public record DomainListItemDto(
        String domainKey,
        String label
) {}

