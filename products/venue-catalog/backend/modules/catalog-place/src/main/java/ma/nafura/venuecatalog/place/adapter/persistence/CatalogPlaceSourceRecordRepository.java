package ma.nafura.venuecatalog.place.adapter.persistence;

import ma.nafura.venuecatalog.place.domain.PlaceProvider;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CatalogPlaceSourceRecordRepository extends JpaRepository<CatalogPlaceSourceRecordEntity, UUID> {

    Optional<CatalogPlaceSourceRecordEntity> findByProviderAndExternalId(PlaceProvider provider, String externalId);

    List<CatalogPlaceSourceRecordEntity> findByCatalogPlaceId(UUID catalogPlaceId);
}
