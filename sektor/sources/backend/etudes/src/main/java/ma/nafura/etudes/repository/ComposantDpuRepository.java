package ma.nafura.etudes.repository;

import java.util.List;
import java.util.UUID;
import ma.nafura.etudes.domain.dpu.ComposantDpu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ComposantDpuRepository extends JpaRepository<ComposantDpu, UUID> {

    List<ComposantDpu> findByPrixDpuIdAndTenantIdOrderByOrdreAsc(UUID prixDpuId, UUID tenantId);

    @Query(
            """
            SELECT c FROM ComposantDpu c
            JOIN FETCH c.prixDpu p
            WHERE c.tenantId = :tenantId
              AND c.referenceType = 'LIBRE'
              AND (c.horsReferentiel = false OR c.horsReferentiel IS NULL)
              AND p.dpgfNoeudId IN (
                SELECT n.id FROM DpgfNoeud n
                WHERE n.tenantId = :tenantId AND n.dpgf.id = :dpgfId
              )
            ORDER BY c.libelle ASC
            """)
    List<ComposantDpu> findLibresRattrapage(
            @Param("tenantId") UUID tenantId, @Param("dpgfId") UUID dpgfId);

    List<ComposantDpu> findByIdInAndTenantId(List<UUID> ids, UUID tenantId);

    List<ComposantDpu> findByTenantIdAndItemId(UUID tenantId, UUID itemId);
}
