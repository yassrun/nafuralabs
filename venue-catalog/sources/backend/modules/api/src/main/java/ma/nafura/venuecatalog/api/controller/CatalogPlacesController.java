package ma.nafura.venuecatalog.api.controller;

import ma.nafura.venuecatalog.api.dto.CatalogDtos;
import ma.nafura.venuecatalog.api.mapper.CatalogDtoMapper;
import ma.nafura.venuecatalog.api.security.CatalogReadAccess;
import ma.nafura.venuecatalog.api.security.CatalogWriteAccess;
import ma.nafura.venuecatalog.compliance.MediaSyncService;
import ma.nafura.venuecatalog.enrichment.application.PlaceEnrichmentQueryService;
import ma.nafura.venuecatalog.enrichment.application.PlaceNameMaintenanceService;
import ma.nafura.venuecatalog.enrichment.application.VenueEnrichmentPipelineService;
import ma.nafura.venuecatalog.enrichment.domain.EnrichmentModels;
import ma.nafura.venuecatalog.place.adapter.persistence.CatalogPlaceEntity;
import ma.nafura.venuecatalog.place.adapter.persistence.CatalogPlaceMediaEntity;
import ma.nafura.venuecatalog.place.application.CatalogPlaceService;
import ma.nafura.venuecatalog.place.domain.CityCode;
import ma.nafura.venuecatalog.place.domain.PlaceStatus;
import ma.nafura.venuecatalog.place.domain.PrimaryCategory;
import ma.nafura.venuecatalog.place.domain.taxonomy.VenueMaTaxonomyV0;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/catalog/places")
@CatalogReadAccess
public class CatalogPlacesController {

    private final CatalogPlaceService placeService;
    private final CatalogDtoMapper mapper;
    private final MediaSyncService mediaSyncService;
    private final PlaceEnrichmentQueryService enrichmentQueryService;
    private final VenueEnrichmentPipelineService enrichmentPipelineService;
    private final PlaceNameMaintenanceService nameMaintenanceService;

    public CatalogPlacesController(
            CatalogPlaceService placeService,
            CatalogDtoMapper mapper,
            MediaSyncService mediaSyncService,
            PlaceEnrichmentQueryService enrichmentQueryService,
            VenueEnrichmentPipelineService enrichmentPipelineService,
            PlaceNameMaintenanceService nameMaintenanceService
    ) {
        this.placeService = placeService;
        this.mapper = mapper;
        this.mediaSyncService = mediaSyncService;
        this.enrichmentQueryService = enrichmentQueryService;
        this.enrichmentPipelineService = enrichmentPipelineService;
        this.nameMaintenanceService = nameMaintenanceService;
    }

    @GetMapping
    public CatalogDtos.PlaceListResponse listPlaces(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) CityCode cityCode,
            @RequestParam(required = false) PrimaryCategory primaryCategory,
            @RequestParam(required = false) PlaceStatus status,
            @RequestParam(required = false) Boolean needsReview,
            @RequestParam(required = false) String districtCode,
            @RequestParam(required = false) List<String> venueTypes,
            @RequestParam(required = false) String venueType,
            @RequestParam(required = false) List<String> activities,
            @RequestParam(required = false) String activity,
            @RequestParam(required = false) String aiDecision,
            @RequestParam(required = false) Double minScore,
            @RequestParam(required = false) String scoreAppId,
            @RequestParam(required = false) String enrichmentStatus,
            @RequestParam(required = false) String sort,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "20") int size
    ) {
        Page<CatalogPlaceEntity> results = placeService.listPlaces(
                q, cityCode, primaryCategory, status, needsReview,
                districtCode,
                mergeFilterValues(venueTypes, venueType),
                mergeFilterValues(activities, activity),
                aiDecision, minScore, scoreAppId, enrichmentStatus,
                page, size, sort
        );
        List<UUID> placeIds = results.getContent().stream().map(CatalogPlaceEntity::getId).toList();
        PlaceEnrichmentQueryService.EnrichmentIndex index = enrichmentQueryService.loadIndex(placeIds);
        var primaryMedia = placeService.findPrimaryMediaByPlaceIds(placeIds);
        List<CatalogDtos.PlaceSummaryDto> items = results.getContent().stream()
                .map(place -> mapper.toSummary(
                        place,
                        index.geos().get(place.getId()),
                        index.ais().get(place.getId()),
                        index.scores().getOrDefault(place.getId(), List.of()),
                        primaryMedia.get(place.getId())
                ))
                .toList();
        int nextPage = page + 1;
        String cursor = results.hasNext()
                ? Base64.getEncoder().encodeToString(String.valueOf(nextPage).getBytes())
                : null;
        return new CatalogDtos.PlaceListResponse(
                items,
                new CatalogDtos.PageDto(size, (int) results.getTotalElements(), cursor)
        );
    }

    @GetMapping("/{id}")
    public CatalogDtos.PlaceDetailDto getPlace(@PathVariable UUID id) {
        return toDetail(findPlace(id));
    }

    @GetMapping("/meta/taxonomy")
    public CatalogDtos.TaxonomyMetaResponse taxonomyMeta() {
        return new CatalogDtos.TaxonomyMetaResponse(
                VenueMaTaxonomyV0.categoryValues(),
                VenueMaTaxonomyV0.venueTypeValues(),
                VenueMaTaxonomyV0.venueTypesByCategory(),
                VenueMaTaxonomyV0.settingValues(),
                VenueMaTaxonomyV0.offerValues(),
                VenueMaTaxonomyV0.experienceValues(),
                VenueMaTaxonomyV0.suitableForValues(),
                VenueMaTaxonomyV0.activityValues()
        );
    }

    @PostMapping("/maintenance/normalize-names")
    @CatalogWriteAccess
    public CatalogDtos.NormalizeNamesResponse normalizeNames(
            @RequestBody(required = false) CatalogDtos.NormalizeNamesRequest request
    ) {
        CatalogDtos.NormalizeNamesRequest body = request == null
                ? new CatalogDtos.NormalizeNamesRequest(true, null, null)
                : request;
        boolean dryRun = body.dryRun() == null || body.dryRun();
        CityCode city = null;
        if (body.cityCode() != null && !body.cityCode().isBlank()) {
            try {
                city = CityCode.valueOf(body.cityCode().trim().toUpperCase());
            } catch (IllegalArgumentException ex) {
                throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "invalid cityCode");
            }
        }
        PrimaryCategory category = null;
        if (body.primaryCategory() != null && !body.primaryCategory().isBlank()) {
            try {
                category = PrimaryCategory.valueOf(body.primaryCategory().trim().toUpperCase());
            } catch (IllegalArgumentException ex) {
                throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "invalid primaryCategory");
            }
        }
        PlaceNameMaintenanceService.NormalizeNamesResult result =
                nameMaintenanceService.normalizeNames(city, category, dryRun);
        return new CatalogDtos.NormalizeNamesResponse(
                result.scanned(),
                result.updated(),
                result.skippedNoDistrict(),
                result.unchanged(),
                result.dryRun(),
                result.samples().stream()
                        .map(s -> new CatalogDtos.NormalizeNamesSampleDto(s.id(), s.before(), s.after()))
                        .toList()
        );
    }

    @PatchMapping("/{id}/enrichment")
    @CatalogWriteAccess
    public CatalogDtos.PlaceDetailDto patchEnrichment(
            @PathVariable UUID id,
            @RequestBody CatalogDtos.ManualTaxonomyRequest request,
            @AuthenticationPrincipal Jwt jwt
    ) {
        findPlace(id);
        String actor = jwt == null ? "catalog-operator" : jwt.getSubject();
        try {
            enrichmentPipelineService.applyManualTaxonomy(
                    id,
                    new EnrichmentModels.ManualTaxonomyOverride(
                            request.resolvedVenueTypes(),
                            request.settings(),
                            request.offers(),
                            request.experiences(),
                            request.suitableFor(),
                            request.musicStyles(),
                            request.cuisines(),
                            request.servesAlcohol(),
                            request.verdict()
                    ),
                    actor
            );
        } catch (IllegalArgumentException exception) {
            String message = exception.getMessage() == null ? "invalid_request" : exception.getMessage();
            if (message.startsWith("Place not found")) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "not_found", exception);
            }
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, message, exception);
        }
        return toDetail(findPlace(id));
    }

    @PatchMapping("/{id}/district")
    @CatalogWriteAccess
    public CatalogDtos.PlaceDetailDto patchDistrict(
            @PathVariable UUID id,
            @RequestBody CatalogDtos.ManualDistrictRequest request,
            @AuthenticationPrincipal Jwt jwt
    ) {
        findPlace(id);
        String actor = jwt == null ? "catalog-operator" : jwt.getSubject();
        try {
            enrichmentPipelineService.applyManualDistrict(id, request == null ? null : request.districtCode(), actor);
        } catch (IllegalArgumentException exception) {
            String message = exception.getMessage() == null ? "invalid_request" : exception.getMessage();
            if (message.startsWith("Place not found")) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "not_found", exception);
            }
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, message, exception);
        }
        return toDetail(findPlace(id));
    }

    @PostMapping("/{id}/media/{mediaId}/primary")
    @CatalogWriteAccess
    public CatalogDtos.PlaceDetailDto setPrimaryMedia(
            @PathVariable UUID id,
            @PathVariable UUID mediaId
    ) {
        try {
            placeService.setPrimaryMedia(id, mediaId);
        } catch (IllegalArgumentException exception) {
            String message = exception.getMessage() == null ? "not_found" : exception.getMessage();
            HttpStatus status = message.contains("Media") || message.contains("place")
                    ? HttpStatus.NOT_FOUND
                    : HttpStatus.UNPROCESSABLE_ENTITY;
            throw new ResponseStatusException(status, message, exception);
        }
        return toDetail(findPlace(id));
    }

    @PostMapping("/{id}/approve")
    @CatalogWriteAccess
    public CatalogDtos.PlaceDetailDto approve(@PathVariable UUID id) {
        return updateStatus(id, PlaceStatus.REVIEWED);
    }

    @PostMapping("/{id}/reject")
    @CatalogWriteAccess
    public CatalogDtos.PlaceDetailDto reject(@PathVariable UUID id) {
        return updateStatus(id, PlaceStatus.REJECTED);
    }

    @PostMapping("/{id}/archive")
    @CatalogWriteAccess
    public CatalogDtos.PlaceDetailDto archive(@PathVariable UUID id) {
        return updateStatus(id, PlaceStatus.ARCHIVED);
    }

    @DeleteMapping("/{id}")
    @CatalogWriteAccess
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        try {
            placeService.findAllMedia(id).forEach(item -> {
                try {
                    mediaSyncService.deleteStoredObject(item.getStorageKey());
                } catch (Exception ignored) {
                    // DB row still removed via cascade; orphan object cleaned by retention later
                }
            });
            placeService.deletePlace(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "not_found", exception);
        }
    }

    @PostMapping("/bulk-approve")
    @CatalogWriteAccess
    public CatalogDtos.BulkStatusResponse bulkApprove(
            @RequestBody CatalogDtos.BulkPlaceIdsRequest request
    ) {
        List<CatalogPlaceEntity> places;
        try {
            places = placeService.updateStatus(request.placeIds(), PlaceStatus.REVIEWED);
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "not_found", exception);
        }
        return new CatalogDtos.BulkStatusResponse(
                places.stream().map(CatalogPlaceEntity::getId).toList(),
                PlaceStatus.REVIEWED.name());
    }

    private CatalogDtos.PlaceDetailDto updateStatus(UUID id, PlaceStatus status) {
        try {
            CatalogPlaceEntity place = placeService.updateStatus(id, status);
            return toDetail(place);
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "not_found", exception);
        }
    }

    private CatalogDtos.PlaceDetailDto toDetail(CatalogPlaceEntity place) {
        List<CatalogPlaceMediaEntity> media = placeService.findActiveMedia(place.getId());
        media.forEach(item -> item.setPublicUrl(mediaSyncService.resolvePublicUrl(item)));
        return mapper.toDetail(
                place,
                media,
                placeService.findSourceRecords(place.getId()),
                enrichmentPipelineService.getSnapshot(place.getId()).orElse(null)
        );
    }

    private CatalogPlaceEntity findPlace(UUID id) {
        return placeService.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "not_found"));
    }

    /** Merges multi-select list params with legacy single value (supports CSV in the single). */
    private static List<String> mergeFilterValues(List<String> multi, String single) {
        List<String> out = new ArrayList<>();
        if (multi != null) {
            out.addAll(multi);
        }
        if (single != null && !single.isBlank()) {
            out.add(single);
        }
        return out.isEmpty() ? null : out;
    }
}
