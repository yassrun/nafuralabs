package ma.nafura.venuecatalog.enrichment.application;

import ma.nafura.venuecatalog.enrichment.adapter.persistence.CatalogPlaceAiEnrichmentEntity;
import ma.nafura.venuecatalog.enrichment.adapter.persistence.CatalogPlaceAiEnrichmentRepository;
import ma.nafura.venuecatalog.enrichment.adapter.persistence.CatalogPlaceAppScoreEntity;
import ma.nafura.venuecatalog.enrichment.adapter.persistence.CatalogPlaceAppScoreRepository;
import ma.nafura.venuecatalog.enrichment.adapter.persistence.CatalogPlaceGeoResolutionEntity;
import ma.nafura.venuecatalog.enrichment.adapter.persistence.CatalogPlaceGeoResolutionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class PlaceEnrichmentQueryService {

    private final CatalogPlaceGeoResolutionRepository geoRepository;
    private final CatalogPlaceAiEnrichmentRepository aiRepository;
    private final CatalogPlaceAppScoreRepository scoreRepository;

    public PlaceEnrichmentQueryService(
            CatalogPlaceGeoResolutionRepository geoRepository,
            CatalogPlaceAiEnrichmentRepository aiRepository,
            CatalogPlaceAppScoreRepository scoreRepository
    ) {
        this.geoRepository = geoRepository;
        this.aiRepository = aiRepository;
        this.scoreRepository = scoreRepository;
    }

    @Transactional(readOnly = true)
    public EnrichmentIndex loadIndex(List<UUID> placeIds) {
        Map<UUID, CatalogPlaceGeoResolutionEntity> geos = geoRepository.findByCatalogPlaceIdIn(placeIds).stream()
                .collect(Collectors.toMap(CatalogPlaceGeoResolutionEntity::getCatalogPlaceId, g -> g, (a, b) -> a));
        Map<UUID, CatalogPlaceAiEnrichmentEntity> ais = aiRepository.findByCatalogPlaceIdIn(placeIds).stream()
                .collect(Collectors.toMap(CatalogPlaceAiEnrichmentEntity::getCatalogPlaceId, a -> a, (a, b) -> a));
        Map<UUID, List<CatalogPlaceAppScoreEntity>> scores = new HashMap<>();
        for (CatalogPlaceAppScoreEntity score : scoreRepository.findByCatalogPlaceIdIn(placeIds)) {
            scores.computeIfAbsent(score.getCatalogPlaceId(), id -> new java.util.ArrayList<>()).add(score);
        }
        return new EnrichmentIndex(geos, ais, scores);
    }

    public record EnrichmentIndex(
            Map<UUID, CatalogPlaceGeoResolutionEntity> geos,
            Map<UUID, CatalogPlaceAiEnrichmentEntity> ais,
            Map<UUID, List<CatalogPlaceAppScoreEntity>> scores
    ) {}
}
