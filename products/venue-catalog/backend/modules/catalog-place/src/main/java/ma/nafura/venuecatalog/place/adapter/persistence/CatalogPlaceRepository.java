package ma.nafura.venuecatalog.place.adapter.persistence;

import ma.nafura.venuecatalog.place.domain.CityCode;
import ma.nafura.venuecatalog.place.domain.PlaceStatus;
import ma.nafura.venuecatalog.place.domain.PrimaryCategory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CatalogPlaceRepository extends JpaRepository<CatalogPlaceEntity, UUID> {

    @Query("""
            SELECT p FROM CatalogPlaceEntity p
            WHERE (:q IS NULL OR :q = '' OR LOWER(p.canonicalName) LIKE LOWER(CONCAT('%', :q, '%')))
              AND (:cityCode IS NULL OR p.cityCode = :cityCode)
              AND (:primaryCategory IS NULL OR p.primaryCategory = :primaryCategory)
              AND (:status IS NULL OR p.status = :status)
            """)
    Page<CatalogPlaceEntity> search(
            @Param("q") String q,
            @Param("cityCode") CityCode cityCode,
            @Param("primaryCategory") PrimaryCategory primaryCategory,
            @Param("status") PlaceStatus status,
            Pageable pageable
    );

    List<CatalogPlaceEntity> findByCityCodeAndPrimaryCategory(CityCode cityCode, PrimaryCategory primaryCategory);
}
