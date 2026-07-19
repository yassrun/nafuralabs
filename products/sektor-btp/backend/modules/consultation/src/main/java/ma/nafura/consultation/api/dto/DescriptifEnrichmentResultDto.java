package ma.nafura.consultation.api.dto;

import java.util.List;
import ma.nafura.consultation.domain.model.Consultation;

/**
 * Outcome of the CPS descriptif enrichment pass: the refreshed consultation
 * plus a small report the UI surfaces to the user.
 */
public record DescriptifEnrichmentResultDto(
        Consultation consultation,
        int postesTotal,
        int matched,
        List<String> unmatchedCodes) {}
