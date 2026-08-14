package ma.nafura.venuecatalog.enrichment.adapter.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CatalogPlaceAppScoreRepository extends JpaRepository<CatalogPlaceAppScoreEntity, UUID> {
    List<CatalogPlaceAppScoreEntity> findByCatalogPlaceId(UUID catalogPlaceId);
    List<CatalogPlaceAppScoreEntity> findByCatalogPlaceIdIn(List<UUID> placeIds);
    Optional<CatalogPlaceAppScoreEntity> findByCatalogPlaceIdAndAppId(UUID catalogPlaceId, String appId);
}
