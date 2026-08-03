package ma.nafura.venuecatalog.enrichment.adapter.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CatalogPlaceGeoResolutionRepository extends JpaRepository<CatalogPlaceGeoResolutionEntity, UUID> {
    Optional<CatalogPlaceGeoResolutionEntity> findByCatalogPlaceId(UUID catalogPlaceId);
    List<CatalogPlaceGeoResolutionEntity> findByCatalogPlaceIdIn(List<UUID> placeIds);
}
