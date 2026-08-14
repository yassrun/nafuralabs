package ma.nafura.venuecatalog.place.application;

import ma.nafura.platform.integrations.googleplaces.PlaceDetails;
import ma.nafura.venuecatalog.place.adapter.persistence.CatalogPlaceEntity;
import ma.nafura.venuecatalog.place.adapter.persistence.CatalogPlaceMediaEntity;
import ma.nafura.venuecatalog.place.adapter.persistence.CatalogPlaceMediaRepository;
import ma.nafura.venuecatalog.place.adapter.persistence.CatalogPlaceRepository;
import ma.nafura.venuecatalog.place.adapter.persistence.CatalogPlaceSourceRecordEntity;
import ma.nafura.venuecatalog.place.adapter.persistence.CatalogPlaceSourceRecordRepository;
import ma.nafura.venuecatalog.place.domain.CityCode;
import ma.nafura.venuecatalog.place.domain.MediaStatus;
import ma.nafura.venuecatalog.place.domain.PlaceProvider;
import ma.nafura.venuecatalog.place.domain.PlaceStatus;
import ma.nafura.venuecatalog.place.domain.PrimaryCategory;
import ma.nafura.venuecatalog.place.domain.model.PlaceModels;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Service
@Transactional
public class CatalogPlaceService {

    private final CatalogPlaceRepository placeRepository;
    private final CatalogPlaceSourceRecordRepository sourceRecordRepository;
    private final CatalogPlaceMediaRepository mediaRepository;
    private final PlaceNormalizationService normalizationService;
    private final int geoRoundDecimals;
    private final double confidenceReviewThreshold;

    public CatalogPlaceService(
            CatalogPlaceRepository placeRepository,
            CatalogPlaceSourceRecordRepository sourceRecordRepository,
            CatalogPlaceMediaRepository mediaRepository,
            PlaceNormalizationService normalizationService,
            VenueCatalogPlaceProperties properties
    ) {
        this.placeRepository = placeRepository;
        this.sourceRecordRepository = sourceRecordRepository;
        this.mediaRepository = mediaRepository;
        this.normalizationService = normalizationService;
        this.geoRoundDecimals = properties.getDedupe().getGeoRoundDecimals();
        this.confidenceReviewThreshold = properties.getDedupe().getConfidenceReviewThreshold();
    }

    public UpsertResult upsertFromProvider(
            PlaceDetails details,
            CityCode cityCode,
            String countryCode,
            PrimaryCategory categoryHint
    ) {
        String externalId = details.id();
        Optional<CatalogPlaceSourceRecordEntity> existingSource =
                sourceRecordRepository.findByProviderAndExternalId(PlaceProvider.GOOGLE_PLACES, externalId);

        String canonicalName = details.displayName() != null ? details.displayName().text() : "Unknown";
        PlaceModels.Geo geo = new PlaceModels.Geo(details.location().lat(), details.location().lng());
        PrimaryCategory category = normalizationService.mapCategory(details.types(), details.primaryType(), categoryHint);
        PlaceModels.Address address = normalizationService.mapAddress(details, cityCode, countryCode);
        canonicalName = normalizationService.cleanCanonicalName(
                canonicalName,
                address != null ? address.district() : null,
                cityCode
        );

        List<UUID> duplicateCandidates = findDuplicateCandidates(canonicalName, geo, cityCode, category, existingSource.map(CatalogPlaceSourceRecordEntity::getCatalogPlaceId));

        CatalogPlaceEntity place;
        boolean created;
        if (existingSource.isPresent()) {
            place = placeRepository.findById(existingSource.get().getCatalogPlaceId()).orElseThrow();
            created = false;
        } else {
            place = new CatalogPlaceEntity();
            place.setStatus(PlaceStatus.DRAFT);
            created = true;
        }

        place.setCanonicalName(canonicalName);
        place.setCountryCode(countryCode);
        place.setCityCode(cityCode);
        place.setPrimaryCategory(category);
        place.setProviderTypes(details.types());
        place.setAddress(address);
        place.setGeo(geo);
        place.setContact(normalizationService.mapContact(details));
        place.setOpeningHours(normalizationService.mapOpeningHours(details.regularOpeningHours()));
        place.setProviderRating(normalizationService.mapRating(details));
        place.setAttributes(normalizationService.mapAttributes(details));
        place.setQuality(normalizationService.computeQuality(
                address, geo, place.getContact(), category, duplicateCandidates, confidenceReviewThreshold));
        if (place.getStatus() == PlaceStatus.DRAFT) {
            place.setStatus(PlaceStatus.ENRICHED);
        }

        place = placeRepository.save(place);

        OffsetDateTime now = OffsetDateTime.now();
        CatalogPlaceSourceRecordEntity source = existingSource.orElseGet(CatalogPlaceSourceRecordEntity::new);
        source.setCatalogPlaceId(place.getId());
        source.setProvider(PlaceProvider.GOOGLE_PLACES);
        source.setExternalId(externalId);
        source.setFetchedAt(now);
        source.setFreshnessUntil(now.plusDays(30));
        source.setRawChecksum(normalizationService.checksum(details));
        sourceRecordRepository.save(source);

        return new UpsertResult(place, created);
    }

    @Transactional(readOnly = true)
    public boolean existsByGooglePlaceId(String externalId) {
        if (externalId == null || externalId.isBlank()) {
            return false;
        }
        return sourceRecordRepository.findByProviderAndExternalId(PlaceProvider.GOOGLE_PLACES, externalId).isPresent();
    }

    @Transactional(readOnly = true)
    public Optional<CatalogPlaceSourceRecordEntity> findGoogleSource(String externalId) {
        if (externalId == null || externalId.isBlank()) {
            return Optional.empty();
        }
        return sourceRecordRepository.findByProviderAndExternalId(PlaceProvider.GOOGLE_PLACES, externalId);
    }

    @Transactional(readOnly = true)
    public long countActiveMedia(UUID placeId) {
        return mediaRepository.countByCatalogPlaceIdAndStatus(placeId, MediaStatus.ACTIVE);
    }

    @Transactional(readOnly = true)
    public Optional<CatalogPlaceEntity> findById(UUID id) {
        return placeRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public List<CatalogPlaceMediaEntity> findActiveMedia(UUID placeId) {
        return mediaRepository.findByCatalogPlaceIdAndStatusOrderBySortOrderAsc(placeId, MediaStatus.ACTIVE);
    }

    /**
     * First ACTIVE media per place (lowest {@code sortOrder}) — cover photo convention.
     */
    @Transactional(readOnly = true)
    public Map<UUID, CatalogPlaceMediaEntity> findPrimaryMediaByPlaceIds(Collection<UUID> placeIds) {
        if (placeIds == null || placeIds.isEmpty()) {
            return Map.of();
        }
        List<CatalogPlaceMediaEntity> media = mediaRepository
                .findByCatalogPlaceIdInAndStatusOrderBySortOrderAsc(placeIds, MediaStatus.ACTIVE);
        Map<UUID, CatalogPlaceMediaEntity> primary = new LinkedHashMap<>();
        for (CatalogPlaceMediaEntity item : media) {
            primary.putIfAbsent(item.getCatalogPlaceId(), item);
        }
        return primary;
    }

    /**
     * Sets cover photo ({@code sortOrder = 0}) and reindexes remaining ACTIVE media.
     */
    public CatalogPlaceMediaEntity setPrimaryMedia(UUID placeId, UUID mediaId) {
        if (!placeRepository.existsById(placeId)) {
            throw new IllegalArgumentException("Catalog place not found: " + placeId);
        }
        List<CatalogPlaceMediaEntity> media = mediaRepository
                .findByCatalogPlaceIdAndStatusOrderBySortOrderAsc(placeId, MediaStatus.ACTIVE);
        CatalogPlaceMediaEntity target = media.stream()
                .filter(item -> item.getId().equals(mediaId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Media not found for place: " + mediaId));
        short next = 1;
        for (CatalogPlaceMediaEntity item : media) {
            if (item.getId().equals(mediaId)) {
                item.setSortOrder((short) 0);
            } else {
                item.setSortOrder(next++);
            }
        }
        mediaRepository.saveAll(media);
        return target;
    }

    @Transactional(readOnly = true)
    public List<CatalogPlaceMediaEntity> findAllMedia(UUID placeId) {
        return mediaRepository.findByCatalogPlaceIdOrderBySortOrderAsc(placeId);
    }

    @Transactional(readOnly = true)
    public List<CatalogPlaceSourceRecordEntity> findSourceRecords(UUID placeId) {
        return sourceRecordRepository.findByCatalogPlaceId(placeId);
    }

    @Transactional(readOnly = true)
    public Page<CatalogPlaceEntity> listPlaces(
            String q,
            CityCode cityCode,
            PrimaryCategory primaryCategory,
            PlaceStatus status,
            Boolean needsReview,
            int page,
            int size
    ) {
        return listPlaces(
                q, cityCode, primaryCategory, status, needsReview,
                null, null, null, null, null, null, null,
                page, size, null
        );
    }

    @Transactional(readOnly = true)
    public Page<CatalogPlaceEntity> listPlaces(
            String q,
            CityCode cityCode,
            PrimaryCategory primaryCategory,
            PlaceStatus status,
            Boolean needsReview,
            String districtCode,
            List<String> venueTypes,
            List<String> activities,
            String aiDecision,
            Double minScore,
            String scoreAppId,
            String enrichmentStatus,
            int page,
            int size
    ) {
        return listPlaces(
                q, cityCode, primaryCategory, status, needsReview,
                districtCode, venueTypes, activities, aiDecision, minScore, scoreAppId, enrichmentStatus,
                page, size, null
        );
    }

    @Transactional(readOnly = true)
    public Page<CatalogPlaceEntity> listPlaces(
            String q,
            CityCode cityCode,
            PrimaryCategory primaryCategory,
            PlaceStatus status,
            Boolean needsReview,
            String districtCode,
            List<String> venueTypes,
            List<String> activities,
            String aiDecision,
            Double minScore,
            String scoreAppId,
            String enrichmentStatus,
            int page,
            int size,
            String sort
    ) {
        PlaceListSort.Parsed parsed = PlaceListSort.parse(page, size, sort);
        return placeRepository.searchFiltered(
                blankToNull(q),
                cityCode == null ? null : cityCode.name(),
                primaryCategory == null ? null : primaryCategory.name(),
                status == null ? null : status.name(),
                needsReview == null ? null : needsReview.toString(),
                blankToNull(districtCode),
                toCsvFilter(venueTypes),
                toCsvFilter(activities),
                blankToNull(aiDecision),
                minScore,
                blankToNull(scoreAppId),
                blankToNull(enrichmentStatus),
                parsed.sortKey(),
                parsed.pageable()
        );
    }

    @Transactional(readOnly = true)
    public List<CatalogPlaceEntity> listByCity(CityCode cityCode) {
        return placeRepository.findByCityCode(cityCode);
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }

    /** CSV for native {@code ?|} filters; null when empty (no filter). */
    private static String toCsvFilter(List<String> values) {
        if (values == null || values.isEmpty()) {
            return null;
        }
        Set<String> normalized = new LinkedHashSet<>();
        for (String value : values) {
            if (value == null || value.isBlank()) {
                continue;
            }
            for (String part : value.split(",")) {
                String trimmed = part.trim().toUpperCase(Locale.ROOT);
                if (!trimmed.isEmpty()) {
                    normalized.add(trimmed);
                }
            }
        }
        if (normalized.isEmpty()) {
            return null;
        }
        return String.join(",", normalized);
    }

    public void updateMediaPublicUrl(UUID mediaId, String publicUrl) {
        mediaRepository.findById(mediaId).ifPresent(media -> {
            media.setPublicUrl(publicUrl);
            mediaRepository.save(media);
        });
    }

    public CatalogPlaceMediaEntity saveMedia(CatalogPlaceMediaEntity media) {
        return mediaRepository.save(media);
    }

    public CatalogPlaceEntity savePlace(CatalogPlaceEntity place) {
        return placeRepository.save(place);
    }

    public CatalogPlaceEntity updateStatus(UUID placeId, PlaceStatus targetStatus) {
        CatalogPlaceEntity place = placeRepository.findById(placeId)
                .orElseThrow(() -> new IllegalArgumentException("Catalog place not found: " + placeId));
        place.setStatus(targetStatus);
        return placeRepository.save(place);
    }

    /**
     * Hard delete — cascades media + source records in DB (FK ON DELETE CASCADE).
     * Caller should remove MinIO objects before calling when needed.
     */
    public void deletePlace(UUID placeId) {
        if (!placeRepository.existsById(placeId)) {
            throw new IllegalArgumentException("Catalog place not found: " + placeId);
        }
        placeRepository.deleteById(placeId);
    }

    public List<CatalogPlaceEntity> updateStatus(List<UUID> placeIds, PlaceStatus targetStatus) {
        if (placeIds == null || placeIds.isEmpty()) {
            return List.of();
        }
        List<CatalogPlaceEntity> places = placeRepository.findAllById(placeIds);
        if (places.size() != placeIds.stream().distinct().count()) {
            throw new IllegalArgumentException("One or more catalog places were not found");
        }
        places.forEach(place -> place.setStatus(targetStatus));
        return placeRepository.saveAll(places);
    }

    private List<UUID> findDuplicateCandidates(
            String canonicalName,
            PlaceModels.Geo geo,
            CityCode cityCode,
            PrimaryCategory category,
            Optional<UUID> excludePlaceId
    ) {
        String key = normalizationService.dedupeKey(canonicalName, geo, cityCode, category, geoRoundDecimals);
        List<CatalogPlaceEntity> candidates = placeRepository.findByCityCodeAndPrimaryCategory(cityCode, category);
        List<UUID> duplicates = new ArrayList<>();
        for (CatalogPlaceEntity candidate : candidates) {
            if (excludePlaceId.isPresent() && candidate.getId().equals(excludePlaceId.get())) {
                continue;
            }
            String candidateKey = normalizationService.dedupeKey(
                    candidate.getCanonicalName(), candidate.getGeo(), candidate.getCityCode(), candidate.getPrimaryCategory(), geoRoundDecimals);
            if (candidateKey.equals(key)) {
                duplicates.add(candidate.getId());
            }
        }
        return duplicates;
    }

    public record UpsertResult(CatalogPlaceEntity place, boolean created) {}
}
