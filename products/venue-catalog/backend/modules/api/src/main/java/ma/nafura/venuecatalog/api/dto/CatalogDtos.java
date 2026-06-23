package ma.nafura.venuecatalog.api.dto;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public final class CatalogDtos {

    private CatalogDtos() {}

    public record PageDto(int size, Integer total, String cursor) {}

    public record PlaceListResponse(List<PlaceSummaryDto> items, PageDto page) {}

    public record PlaceSummaryDto(
            UUID id,
            String canonicalName,
            String status,
            String cityCode,
            String primaryCategory,
            Map<String, Object> address,
            Map<String, Object> quality,
            String updatedAt
    ) {}

    public record PlaceDetailDto(
            UUID id,
            String canonicalName,
            String status,
            String countryCode,
            String cityCode,
            String primaryCategory,
            List<String> providerTypes,
            Map<String, Object> address,
            Map<String, Object> geo,
            Map<String, Object> contact,
            List<Map<String, Object>> openingHours,
            Map<String, Object> providerRating,
            Map<String, Object> attributes,
            List<MediaDto> media,
            List<SourceRecordDto> sourceRecords,
            Map<String, Object> quality,
            String createdAt,
            String updatedAt
    ) {}

    public record MediaDto(
            UUID id,
            String source,
            String url,
            Integer width,
            Integer height,
            String attributionText,
            String authorName,
            boolean reusable,
            String expiresAt,
            int sortOrder
    ) {}

    public record SourceRecordDto(
            String provider,
            String externalId,
            String fetchedAt,
            String freshnessUntil,
            String rawChecksum
    ) {}

    public record JobAcceptedResponse(UUID jobId, String status) {}

    public record JobDetailDto(
            UUID id,
            String type,
            String provider,
            String status,
            Map<String, Object> request,
            Map<String, Object> result,
            Map<String, Object> progress,
            Map<String, Object> error,
            String requestedBy,
            String startedAt,
            String finishedAt,
            String createdAt
    ) {}

    public record JobListResponse(List<JobDetailDto> items, PageDto page) {}

    public record GooglePlacesSearchRequest(
            String mode,
            Map<String, Object> query,
            Map<String, Object> options
    ) {}

    public record GooglePlacesRefreshRequest(
            List<UUID> catalogPlaceIds,
            Boolean refreshMedia,
            Boolean refreshHours
    ) {}

    public record ErrorResponse(String error, String message, List<Map<String, String>> details, String traceId) {}
}
