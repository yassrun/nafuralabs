package ma.nafura.venuecatalog.api.mapper;

import com.fasterxml.jackson.databind.ObjectMapper;
import ma.nafura.venuecatalog.api.dto.CatalogDtos;
import ma.nafura.venuecatalog.compliance.MediaSyncService;
import ma.nafura.venuecatalog.enrichment.adapter.persistence.CatalogJobStepEntity;
import ma.nafura.venuecatalog.enrichment.adapter.persistence.CatalogPlaceAiEnrichmentEntity;
import ma.nafura.venuecatalog.enrichment.adapter.persistence.CatalogPlaceAppScoreEntity;
import ma.nafura.venuecatalog.enrichment.adapter.persistence.CatalogPlaceGeoResolutionEntity;
import ma.nafura.venuecatalog.enrichment.domain.EnrichmentModels;
import ma.nafura.venuecatalog.job.adapter.persistence.CatalogJobEntity;
import ma.nafura.venuecatalog.job.domain.model.JobModels;
import ma.nafura.venuecatalog.place.adapter.persistence.CatalogPlaceEntity;
import ma.nafura.venuecatalog.place.adapter.persistence.CatalogPlaceMediaEntity;
import ma.nafura.venuecatalog.place.adapter.persistence.CatalogPlaceSourceRecordEntity;
import org.springframework.stereotype.Component;

import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class CatalogDtoMapper {

    private static final DateTimeFormatter ISO = DateTimeFormatter.ISO_OFFSET_DATE_TIME;

    private final ObjectMapper objectMapper;
    private final MediaSyncService mediaSyncService;

    public CatalogDtoMapper(ObjectMapper objectMapper, MediaSyncService mediaSyncService) {
        this.objectMapper = objectMapper;
        this.mediaSyncService = mediaSyncService;
    }

    public CatalogDtos.PlaceSummaryDto toSummary(
            CatalogPlaceEntity place,
            CatalogPlaceGeoResolutionEntity geo,
            CatalogPlaceAiEnrichmentEntity ai,
            List<CatalogPlaceAppScoreEntity> scores
    ) {
        return toSummary(place, geo, ai, scores, null);
    }

    public CatalogDtos.PlaceSummaryDto toSummary(
            CatalogPlaceEntity place,
            CatalogPlaceGeoResolutionEntity geo,
            CatalogPlaceAiEnrichmentEntity ai,
            List<CatalogPlaceAppScoreEntity> scores,
            CatalogPlaceMediaEntity primaryMedia
    ) {
        Double layali = scores == null ? null : scores.stream()
                .filter(s -> "LAYALI".equals(s.getAppId()))
                .map(CatalogPlaceAppScoreEntity::getScore)
                .findFirst()
                .orElse(null);
        String enrichmentStatus = ai != null ? "ENRICHED" : geo != null ? "GEO_ONLY" : "NONE";
        String photoUrl = primaryMedia == null ? null : mediaSyncService.resolvePublicUrl(primaryMedia);
        String photoAttribution = primaryMedia == null ? null : primaryMedia.getAttributionText();
        return new CatalogDtos.PlaceSummaryDto(
                place.getId(),
                place.getCanonicalName(),
                place.getStatus().name(),
                place.getCityCode().name(),
                place.getPrimaryCategory().name(),
                toMap(place.getAddress()),
                toMap(place.getQuality()),
                geo == null ? null : geo.getDistrictCode(),
                geo == null ? null : geo.getDistrictLabel(),
                ai == null || ai.getVenueTypes() == null ? List.of() : ai.getVenueTypes(),
                ai == null || ai.getVenueTypes() == null || ai.getVenueTypes().isEmpty()
                        ? null
                        : ai.getVenueTypes().get(0),
                ai == null ? null : ai.getVerdict(),
                layali,
                enrichmentStatus,
                photoUrl,
                photoAttribution,
                format(place.getUpdatedAt())
        );
    }

    public CatalogDtos.PlaceDetailDto toDetail(
            CatalogPlaceEntity place,
            List<CatalogPlaceMediaEntity> media,
            List<CatalogPlaceSourceRecordEntity> sources,
            EnrichmentModels.PlaceEnrichmentSnapshot enrichment
    ) {
        return new CatalogDtos.PlaceDetailDto(
                place.getId(),
                place.getCanonicalName(),
                place.getStatus().name(),
                place.getCountryCode(),
                place.getCityCode().name(),
                place.getPrimaryCategory().name(),
                place.getProviderTypes(),
                toMap(place.getAddress()),
                toMap(place.getGeo()),
                toMap(place.getContact()),
                place.getOpeningHours() == null ? List.of() : place.getOpeningHours().stream().map(this::toMap).toList(),
                toMap(place.getProviderRating()),
                toMap(place.getAttributes()),
                media.stream().map(this::toMedia).toList(),
                sources.stream().map(this::toSource).toList(),
                toMap(place.getQuality()),
                enrichment == null ? null : toMap(enrichment),
                format(place.getCreatedAt()),
                format(place.getUpdatedAt())
        );
    }

    public CatalogDtos.MediaDto toMedia(CatalogPlaceMediaEntity media) {
        return new CatalogDtos.MediaDto(
                media.getId(),
                media.getSource().name(),
                mediaSyncService.resolvePublicUrl(media),
                media.getWidth(),
                media.getHeight(),
                media.getAttributionText(),
                media.getAuthorName(),
                media.isReusable(),
                format(media.getExpiresAt()),
                media.getSortOrder()
        );
    }

    public CatalogDtos.SourceRecordDto toSource(CatalogPlaceSourceRecordEntity source) {
        return new CatalogDtos.SourceRecordDto(
                source.getProvider().name(),
                source.getExternalId(),
                format(source.getFetchedAt()),
                format(source.getFreshnessUntil()),
                source.getRawChecksum()
        );
    }

    public CatalogDtos.JobDetailDto toJob(CatalogJobEntity job) {
        return toJob(job, List.of());
    }

    public CatalogDtos.JobDetailDto toJob(CatalogJobEntity job, List<CatalogJobStepEntity> steps) {
        return new CatalogDtos.JobDetailDto(
                job.getId(),
                job.getType().name(),
                job.getProvider().name(),
                job.getStatus().name(),
                toMap(job.getRequest()),
                toMap(job.getResult()),
                toMap(job.getProgress()),
                toMap(job.getError()),
                steps.stream().map(this::toStep).toList(),
                job.getRequestedBy(),
                format(job.getStartedAt()),
                format(job.getFinishedAt()),
                format(job.getCreatedAt())
        );
    }

    public Map<String, Object> toStep(CatalogJobStepEntity step) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", step.getId());
        map.put("catalogPlaceId", step.getCatalogPlaceId());
        map.put("stepType", step.getStepType());
        map.put("status", step.getStatus());
        map.put("attemptCount", step.getAttemptCount());
        map.put("skipped", step.isSkipped());
        map.put("skipReason", step.getSkipReason());
        map.put("errorCode", step.getErrorCode());
        map.put("errorMessage", step.getErrorMessage());
        map.put("retryable", step.getRetryable());
        map.put("details", step.getDetails());
        map.put("startedAt", format(step.getStartedAt()));
        map.put("finishedAt", format(step.getFinishedAt()));
        return map;
    }

    public JobModels.JobRequest toJobRequest(CatalogDtos.GooglePlacesSearchRequest request) {
        return new JobModels.JobRequest(
                request.mode(),
                request.query(),
                request.options(),
                null,
                null,
                null
        );
    }

    public JobModels.JobRequest toJobRequest(CatalogDtos.GooglePlacesRefreshRequest request) {
        return new JobModels.JobRequest(
                null,
                null,
                null,
                request.catalogPlaceIds(),
                request.refreshMedia(),
                request.refreshHours()
        );
    }

    public JobModels.JobRequest toJobRequest(CatalogDtos.EnrichmentJobRequest request) {
        return new JobModels.JobRequest(
                "ENRICH",
                request.query(),
                request.options(),
                request.catalogPlaceIds(),
                null,
                null
        );
    }

    private Map<String, Object> toMap(Object value) {
        if (value == null) {
            return null;
        }
        return objectMapper.convertValue(value, Map.class);
    }

    private String format(java.time.OffsetDateTime value) {
        return value == null ? null : ISO.format(value);
    }
}
