package ma.nafura.chantiers.repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import ma.nafura.chantiers.domain.activite.ActiviteRattachement;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ActiviteRattachementRepository extends TenantScopedRepository<ActiviteRattachement, String> {

    List<ActiviteRattachement> findByTenantIdAndActiviteId(UUID tenantId, String activiteId);

    List<ActiviteRattachement> findByTenantIdAndPosteId(UUID tenantId, String posteId);

    List<ActiviteRattachement> findByTenantIdAndLotIdAndPosteIdIsNull(UUID tenantId, String lotId);

    @Query("""
            select coalesce(sum(r.quantitePrevue), 0) from ActiviteRattachement r
            where r.tenantId = :tenantId and r.posteId = :posteId
            """)
    BigDecimal sommeQuantitePrevuePoste(@Param("tenantId") UUID tenantId, @Param("posteId") String posteId);

    @Query("""
            select coalesce(sum(r.quantitePrevue), 0) from ActiviteRattachement r
            where r.tenantId = :tenantId and r.lotId = :lotId and r.posteId is null
            """)
    BigDecimal sommeQuantitePrevueLotFeuille(@Param("tenantId") UUID tenantId, @Param("lotId") String lotId);
}
