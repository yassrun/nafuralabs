package ma.nafura.venuecatalog.api.dto;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public final class CatalogDtos {

    private CatalogDtos() {}

    public record PageDto(int size, Integer total, String cursor) {}

    public record PlaceListResponse(List<PlaceSummaryDto> items, PageDto page) {}

    public record BulkPlaceIdsRequest(List<UUID> placeIds) {}

    public record BulkStatusResponse(List<UUID> placeIds, String status) {}

    public record PlaceSummaryDto(
            UUID id,
            String canonicalName,
            String status,
            String cityCode,
            String primaryCategory,
            Map<String, Object> address,
            Map<String, Object> quality,
            String districtCode,
            String districtLabel,
            List<String> venueTypes,
            String venueType,
            String aiDecision,
            Double layaliScore,
            String enrichmentStatus,
            String primaryPhotoUrl,
            String primaryPhotoAttribution,
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
            Map<String, Object> enrichment,
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
            List<Map<String, Object>> steps,
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

    public record EnrichmentJobRequest(
            List<UUID> catalogPlaceIds,
            Map<String, Object> query,
            Map<String, Object> options
    ) {}

    public record RetryJobRequest(String resumeFromStep) {}

    /** Manual taxonomy patch. Prefer {@code venueTypes}; legacy {@code venueType} still accepted. */
    public record ManualTaxonomyRequest(
            List<String> venueTypes,
            String venueType,
            List<String> settings,
            List<String> offers,
            List<String> experiences,
            List<String> suitableFor,
            List<String> musicStyles,
            List<String> cuisines,
            Boolean servesAlcohol,
            String verdict
    ) {
        public List<String> resolvedVenueTypes() {
            if (venueTypes != null && !venueTypes.isEmpty()) {
                return venueTypes;
            }
            if (venueType != null && !venueType.isBlank()) {
                return List.of(venueType.trim());
            }
            return null;
        }
    }

    public record TaxonomyMetaResponse(
            List<String> categories,
            List<String> venueTypes,
            Map<String, List<String>> venueTypesByCategory,
            List<String> settings,
            List<String> offers,
            List<String> experiences,
            List<String> suitableFor,
            List<String> activities
    ) {}

    public record NormalizeNamesRequest(
            Boolean dryRun,
            String cityCode,
            String primaryCategory
    ) {}

    public record NormalizeNamesSampleDto(UUID id, String before, String after) {}

    public record NormalizeNamesResponse(
            int scanned,
            int updated,
            int skippedNoDistrict,
            int unchanged,
            boolean dryRun,
            List<NormalizeNamesSampleDto> samples
    ) {}

    public record ManualDistrictRequest(String districtCode) {}

    public record ErrorResponse(String error, String message, List<?> details, String traceId) {}
}
