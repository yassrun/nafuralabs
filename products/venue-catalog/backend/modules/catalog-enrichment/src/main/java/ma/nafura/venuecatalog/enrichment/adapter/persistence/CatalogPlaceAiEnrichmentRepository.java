package ma.nafura.venuecatalog.enrichment.adapter.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CatalogPlaceAiEnrichmentRepository extends JpaRepository<CatalogPlaceAiEnrichmentEntity, UUID> {
    Optional<CatalogPlaceAiEnrichmentEntity> findByCatalogPlaceId(UUID catalogPlaceId);
    List<CatalogPlaceAiEnrichmentEntity> findByCatalogPlaceIdIn(List<UUID> placeIds);
}
