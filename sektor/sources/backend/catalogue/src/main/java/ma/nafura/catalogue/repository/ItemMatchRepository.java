package ma.nafura.catalogue.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.catalogue.domain.article.ItemMatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ItemMatchRepository extends JpaRepository<ItemMatch, UUID> {

    List<ItemMatch> findByTenantIdAndSourceTypeAndSourceIdOrderByConfianceDesc(
            UUID tenantId, String sourceType, UUID sourceId);

    @Query(
            """
            select m.catalogCle from ItemMatch m
            where m.tenantId = :tenantId
              and m.sourceType = :sourceType
              and m.sourceId = :sourceId
              and m.statut = 'REJETE'
            """)
    List<String> findRejectedCles(
            @Param("tenantId") UUID tenantId,
            @Param("sourceType") String sourceType,
            @Param("sourceId") UUID sourceId);

    Optional<ItemMatch> findByTenantIdAndSourceTypeAndSourceIdAndCatalogCleAndStatutIn(
            UUID tenantId,
            String sourceType,
            UUID sourceId,
            String catalogCle,
            Collection<String> statuts);
}
