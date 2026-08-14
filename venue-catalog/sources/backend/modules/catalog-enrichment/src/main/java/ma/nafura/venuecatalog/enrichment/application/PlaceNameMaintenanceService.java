package ma.nafura.venuecatalog.enrichment.application;

import ma.nafura.venuecatalog.enrichment.adapter.persistence.CatalogPlaceGeoResolutionEntity;
import ma.nafura.venuecatalog.enrichment.adapter.persistence.CatalogPlaceGeoResolutionRepository;
import ma.nafura.venuecatalog.place.adapter.persistence.CatalogPlaceEntity;
import ma.nafura.venuecatalog.place.adapter.persistence.CatalogPlaceRepository;
import ma.nafura.venuecatalog.place.application.PlaceNormalizationService;
import ma.nafura.venuecatalog.place.domain.CityCode;
import ma.nafura.venuecatalog.place.domain.PlaceStatus;
import ma.nafura.venuecatalog.place.domain.PrimaryCategory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class PlaceNameMaintenanceService {

    private static final int SAMPLE_LIMIT = 25;

    private final CatalogPlaceRepository placeRepository;
    private final CatalogPlaceGeoResolutionRepository geoRepository;
    private final PlaceNormalizationService normalizationService;

    public PlaceNameMaintenanceService(
            CatalogPlaceRepository placeRepository,
            CatalogPlaceGeoResolutionRepository geoRepository,
            PlaceNormalizationService normalizationService
    ) {
        this.placeRepository = placeRepository;
        this.geoRepository = geoRepository;
        this.normalizationService = normalizationService;
    }

    @Transactional
    public NormalizeNamesResult normalizeNames(CityCode cityCode, PrimaryCategory category, boolean dryRun) {
        List<CatalogPlaceEntity> places = loadPlaces(cityCode, category);
        List<UUID> ids = places.stream().map(CatalogPlaceEntity::getId).toList();
        Map<UUID, CatalogPlaceGeoResolutionEntity> geos = ids.isEmpty()
                ? Map.of()
                : geoRepository.findByCatalogPlaceIdIn(ids).stream()
                        .collect(Collectors.toMap(
                                CatalogPlaceGeoResolutionEntity::getCatalogPlaceId,
                                g -> g,
                                (a, b) -> a
                        ));

        int scanned = 0;
        int updated = 0;
        int skippedNoDistrict = 0;
        int unchanged = 0;
        List<NameSample> samples = new ArrayList<>();

        for (CatalogPlaceEntity place : places) {
            if (place.getStatus() == PlaceStatus.ARCHIVED) {
                continue;
            }
            scanned++;
            String district = resolveDistrict(place, geos.get(place.getId()));
            String before = place.getCanonicalName();
            String after = normalizationService.cleanCanonicalName(before, district, place.getCityCode());

            if (district == null || district.isBlank()) {
                if (Objects.equals(before, after)) {
                    skippedNoDistrict++;
                } else {
                    // city suffix stripped even without district
                    if (!dryRun) {
                        place.setCanonicalName(after);
                        placeRepository.save(place);
                    }
                    updated++;
                    addSample(samples, place.getId(), before, after);
                }
                continue;
            }

            if (Objects.equals(before, after)) {
                unchanged++;
                continue;
            }
            if (!dryRun) {
                place.setCanonicalName(after);
                placeRepository.save(place);
            }
            updated++;
            addSample(samples, place.getId(), before, after);
        }

        return new NormalizeNamesResult(scanned, updated, skippedNoDistrict, unchanged, dryRun, samples);
    }

    private List<CatalogPlaceEntity> loadPlaces(CityCode cityCode, PrimaryCategory category) {
        if (cityCode != null && category != null) {
            return placeRepository.findByCityCodeAndPrimaryCategory(cityCode, category);
        }
        if (cityCode != null) {
            return placeRepository.findByCityCode(cityCode);
        }
        if (category != null) {
            return placeRepository.findAll().stream()
                    .filter(p -> p.getPrimaryCategory() == category)
                    .toList();
        }
        return placeRepository.findAll();
    }

    private static String resolveDistrict(CatalogPlaceEntity place, CatalogPlaceGeoResolutionEntity geo) {
        if (geo != null && geo.getDistrictLabel() != null && !geo.getDistrictLabel().isBlank()) {
            return geo.getDistrictLabel().trim();
        }
        if (geo != null && geo.getDistrictCode() != null && !geo.getDistrictCode().isBlank()) {
            return geo.getDistrictCode().trim();
        }
        if (place.getAddress() != null
                && place.getAddress().district() != null
                && !place.getAddress().district().isBlank()) {
            return place.getAddress().district().trim();
        }
        return null;
    }

    private static void addSample(List<NameSample> samples, UUID id, String before, String after) {
        if (samples.size() < SAMPLE_LIMIT) {
            samples.add(new NameSample(id, before, after));
        }
    }

    public record NameSample(UUID id, String before, String after) {}

    public record NormalizeNamesResult(
            int scanned,
            int updated,
            int skippedNoDistrict,
            int unchanged,
            boolean dryRun,
            List<NameSample> samples
    ) {}
}
