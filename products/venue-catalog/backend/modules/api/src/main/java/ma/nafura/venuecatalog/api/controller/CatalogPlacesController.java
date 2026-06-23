package ma.nafura.venuecatalog.api.controller;

import ma.nafura.venuecatalog.api.dto.CatalogDtos;
import ma.nafura.venuecatalog.api.mapper.CatalogDtoMapper;
import ma.nafura.venuecatalog.api.security.CatalogReadAccess;
import ma.nafura.venuecatalog.place.adapter.persistence.CatalogPlaceEntity;
import ma.nafura.venuecatalog.place.application.CatalogPlaceService;
import ma.nafura.venuecatalog.place.domain.CityCode;
import ma.nafura.venuecatalog.place.domain.PlaceStatus;
import ma.nafura.venuecatalog.place.domain.PrimaryCategory;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.Base64;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/catalog/places")
@CatalogReadAccess
public class CatalogPlacesController {

    private final CatalogPlaceService placeService;
    private final CatalogDtoMapper mapper;

    public CatalogPlacesController(CatalogPlaceService placeService, CatalogDtoMapper mapper) {
        this.placeService = placeService;
        this.mapper = mapper;
    }

    @GetMapping
    public CatalogDtos.PlaceListResponse listPlaces(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) CityCode cityCode,
            @RequestParam(required = false) PrimaryCategory primaryCategory,
            @RequestParam(required = false) PlaceStatus status,
            @RequestParam(required = false) Boolean needsReview,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "20") int size
    ) {
        Page<CatalogPlaceEntity> results = placeService.listPlaces(q, cityCode, primaryCategory, status, needsReview, page, size);
        List<CatalogDtos.PlaceSummaryDto> items = results.getContent().stream().map(mapper::toSummary).toList();
        String cursor = Base64.getEncoder().encodeToString(String.valueOf(page + 1).getBytes());
        return new CatalogDtos.PlaceListResponse(items, new CatalogDtos.PageDto(size, null, cursor));
    }

    @GetMapping("/{id}")
    public CatalogDtos.PlaceDetailDto getPlace(@PathVariable UUID id) {
        CatalogPlaceEntity place = placeService.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "not_found"));
        return mapper.toDetail(
                place,
                placeService.findActiveMedia(id),
                placeService.findSourceRecords(id)
        );
    }
}
