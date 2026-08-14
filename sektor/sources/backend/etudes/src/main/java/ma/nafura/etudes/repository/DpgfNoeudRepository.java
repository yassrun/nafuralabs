package ma.nafura.etudes.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.etudes.domain.dpgf.DpgfNoeud;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface DpgfNoeudRepository extends TenantScopedRepository<DpgfNoeud, UUID> {

    List<DpgfNoeud> findByDpgfIdAndTenantIdOrderByOrdreAsc(UUID dpgfId, UUID tenantId);

    List<DpgfNoeud> findByParentIdAndTenantIdOrderByOrdreAsc(UUID parentId, UUID tenantId);

    Optional<DpgfNoeud> findByIdAndTenantId(UUID id, UUID tenantId);

    void deleteByParentIdAndTenantId(UUID parentId, UUID tenantId);

    /**
     * Bulk delete — avoids StaleStateException when {@code parent_id ON DELETE CASCADE}
     * would remove children before a parent-first {@code deleteAll}.
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(
            value = "DELETE FROM dpgf_noeuds WHERE dpgf_id = :dpgfId AND tenant_id = :tenantId",
            nativeQuery = true)
    int deleteAllByDpgfIdAndTenantId(@Param("dpgfId") UUID dpgfId, @Param("tenantId") UUID tenantId);
}
