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
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

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
    public Optional<CatalogPlaceEntity> findById(UUID id) {
        return placeRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public List<CatalogPlaceMediaEntity> findActiveMedia(UUID placeId) {
        return mediaRepository.findByCatalogPlaceIdAndStatusOrderBySortOrderAsc(placeId, MediaStatus.ACTIVE);
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
        Page<CatalogPlaceEntity> results = placeRepository.search(q, cityCode, primaryCategory, status, PageRequest.of(page, size));
        if (needsReview == null) {
            return results;
        }
        List<CatalogPlaceEntity> filtered = results.getContent().stream()
                .filter(p -> p.getQuality().manualReviewRequired() == needsReview)
                .collect(Collectors.toList());
        return new org.springframework.data.domain.PageImpl<>(filtered, results.getPageable(), filtered.size());
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
