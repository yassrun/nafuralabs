package ma.nafura.platform.documents.docextractor.api.response;

import com.fasterxml.jackson.databind.JsonNode;

import java.time.Instant;
import java.util.List;

/**
 * Discriminated response for the stateless extraction pipeline.
 */
public record StatelessExtractionResponse(
        Outcome outcome,
        JsonNode data,
        JsonNode dataSchema,
        JsonNode presentationSchema,
        ExtractionValidationDto validation,
        List<StatelessExtractionIssue> issues,
        String requestId,
        String provider,
        String model,
        Double costUsd,
        Instant createdAt
) {
    public enum Outcome {
        SCHEMA_PROPOSAL_PENDING,
        COMPLETED,
        REVIEW_REQUIRED,
        REJECTED,
        TECHNICAL_FAILURE
    }
}
