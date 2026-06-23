package ma.nafura.venuecatalog.place.adapter.persistence;

import ma.nafura.venuecatalog.place.domain.MediaStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CatalogPlaceMediaRepository extends JpaRepository<CatalogPlaceMediaEntity, UUID> {

    List<CatalogPlaceMediaEntity> findByCatalogPlaceIdAndStatusOrderBySortOrderAsc(UUID catalogPlaceId, MediaStatus status);

    List<CatalogPlaceMediaEntity> findByCatalogPlaceIdOrderBySortOrderAsc(UUID catalogPlaceId);
}
