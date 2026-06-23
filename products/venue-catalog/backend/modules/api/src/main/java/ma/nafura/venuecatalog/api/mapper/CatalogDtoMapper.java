package ma.nafura.venuecatalog.api.mapper;

import com.fasterxml.jackson.databind.ObjectMapper;
import ma.nafura.venuecatalog.api.dto.CatalogDtos;
import ma.nafura.venuecatalog.compliance.MediaSyncService;
import ma.nafura.venuecatalog.job.adapter.persistence.CatalogJobEntity;
import ma.nafura.venuecatalog.job.domain.model.JobModels;
import ma.nafura.venuecatalog.place.adapter.persistence.CatalogPlaceEntity;
import ma.nafura.venuecatalog.place.adapter.persistence.CatalogPlaceMediaEntity;
import ma.nafura.venuecatalog.place.adapter.persistence.CatalogPlaceSourceRecordEntity;
import ma.nafura.venuecatalog.place.domain.model.PlaceModels;
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

    public CatalogDtos.PlaceSummaryDto toSummary(CatalogPlaceEntity place) {
        return new CatalogDtos.PlaceSummaryDto(
                place.getId(),
                place.getCanonicalName(),
                place.getStatus().name(),
                place.getCityCode().name(),
                place.getPrimaryCategory().name(),
                toMap(place.getAddress()),
                toMap(place.getQuality()),
                format(place.getUpdatedAt())
        );
    }

    public CatalogDtos.PlaceDetailDto toDetail(
            CatalogPlaceEntity place,
            List<CatalogPlaceMediaEntity> media,
            List<CatalogPlaceSourceRecordEntity> sources
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
        return new CatalogDtos.JobDetailDto(
                job.getId(),
                job.getType().name(),
                job.getProvider().name(),
                job.getStatus().name(),
                toMap(job.getRequest()),
                toMap(job.getResult()),
                toMap(job.getProgress()),
                toMap(job.getError()),
                job.getRequestedBy(),
                format(job.getStartedAt()),
                format(job.getFinishedAt()),
                format(job.getCreatedAt())
        );
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
