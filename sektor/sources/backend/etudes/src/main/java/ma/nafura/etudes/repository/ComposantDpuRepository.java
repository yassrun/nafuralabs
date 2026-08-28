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

    @Query(
            """
            SELECT COUNT(c) FROM ComposantDpu c
            JOIN c.prixDpu p
            WHERE c.tenantId = :tenantId
              AND c.referenceType = 'LIBRE'
              AND (c.horsReferentiel = false OR c.horsReferentiel IS NULL)
              AND c.decisionCatalogue IS NULL
              AND p.dpgfNoeudId IN (
                SELECT n.id FROM DpgfNoeud n
                WHERE n.tenantId = :tenantId AND n.dpgf.id = :dpgfId
              )
            """)
    long countLibresSansDecision(@Param("tenantId") UUID tenantId, @Param("dpgfId") UUID dpgfId);

    @Query(
            """
            SELECT c FROM ComposantDpu c
            JOIN FETCH c.prixDpu p
            WHERE c.tenantId = :tenantId
              AND c.decisionCatalogue IS NOT NULL
              AND p.dpgfNoeudId IN (
                SELECT n.id FROM DpgfNoeud n
                WHERE n.tenantId = :tenantId AND n.dpgf.id = :dpgfId
              )
            ORDER BY c.decisionCatalogueAt DESC NULLS LAST, c.libelle ASC
            """)
    List<ComposantDpu> findAvecDecisionCatalogue(
            @Param("tenantId") UUID tenantId, @Param("dpgfId") UUID dpgfId);

    @Query(
            """
            SELECT CASE WHEN COUNT(c) > 0 THEN true ELSE false END
            FROM ComposantDpu c
            JOIN c.prixDpu p
            JOIN DpgfNoeud n ON n.id = p.dpgfNoeudId AND n.tenantId = :tenantId
            WHERE c.id = :composantId
              AND c.tenantId = :tenantId
              AND n.dpgf.id = :dpgfId
            """)
    boolean belongsToDossier(
            @Param("composantId") UUID composantId,
            @Param("tenantId") UUID tenantId,
            @Param("dpgfId") UUID dpgfId);
}
