package ma.nafura.buildintelligence.api.dto;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

public final class BiDtos {

    private BiDtos() {
    }

    public record DocumentDto(
            UUID id,
            String filename,
            String mimeType,
            String documentType,
            String processingStatus,
            String visibility,
            OffsetDateTime createdAt
    ) {
    }

    public record JobAcceptedResponse(UUID jobId, String status) {
    }

    public record ReviewActionRequest(Map<String, Object> correction) {
    }

    public record GenerationRequest(java.util.List<UUID> workItemIds) {
    }

    public record SearchResponse(java.util.List<Map<String, Object>> items) {
    }
}
