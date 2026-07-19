package ma.nafura.achats.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.achats.domain.model.CatalogueFournisseurLigne;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface CatalogueFournisseurLigneRepository
        extends TenantScopedRepository<CatalogueFournisseurLigne, UUID> {

    List<CatalogueFournisseurLigne> findByTenantIdOrderByCreatedAtDesc(UUID tenantId);

    List<CatalogueFournisseurLigne> findByTenantIdAndFournisseurIdOrderByDesignationAsc(
            UUID tenantId, String fournisseurId);

    List<CatalogueFournisseurLigne> findByTenantIdAndArticleIdOrderByDesignationAsc(
            UUID tenantId, String articleId);

    List<CatalogueFournisseurLigne> findByTenantIdAndFournisseurIdAndActifTrueOrderByDesignationAsc(
            UUID tenantId, String fournisseurId);

    Optional<CatalogueFournisseurLigne> findByTenantIdAndFournisseurIdAndArticleIdAndActifTrueAndValidToIsNull(
            UUID tenantId, String fournisseurId, String articleId);

    /** Lignes d'un contrat-cadre de prix ({@code source=CONTRAT}, {@code sourceRefId=contratId}). */
    List<CatalogueFournisseurLigne> findByTenantIdAndSourceAndSourceRefId(
            UUID tenantId, String source, UUID sourceRefId);

    @Query(
            """
            SELECT c FROM CatalogueFournisseurLigne c
            WHERE c.tenantId = :tenantId
              AND c.articleId = :articleId
              AND c.actif = true
              AND c.validFrom <= :date
              AND (c.validTo IS NULL OR c.validTo >= :date)
            ORDER BY c.validFrom DESC
            """)
    List<CatalogueFournisseurLigne> findValidAt(
            @Param("tenantId") UUID tenantId,
            @Param("articleId") String articleId,
            @Param("date") LocalDate date);

    @Query(
            """
            SELECT c FROM CatalogueFournisseurLigne c
            WHERE c.tenantId = :tenantId
              AND c.articleId = :articleId
              AND c.source = :source
              AND c.actif = true
              AND c.validFrom <= :date
              AND (c.validTo IS NULL OR c.validTo >= :date)
            ORDER BY c.validFrom DESC
            """)
    List<CatalogueFournisseurLigne> findValidAtBySource(
            @Param("tenantId") UUID tenantId,
            @Param("articleId") String articleId,
            @Param("source") String source,
            @Param("date") LocalDate date);
}
