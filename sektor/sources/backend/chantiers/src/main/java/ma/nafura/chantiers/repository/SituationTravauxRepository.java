package ma.nafura.chantiers.repository;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.chantiers.domain.situation.SituationTravaux;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface SituationTravauxRepository extends TenantScopedRepository<SituationTravaux, String> {

    List<SituationTravaux> findByTenantIdAndChantierIdOrderByNumeroOrdreDesc(UUID tenantId, String chantierId);

    Optional<SituationTravaux> findByTenantIdAndChantierIdAndNumeroOrdre(
            UUID tenantId, String chantierId, int numeroOrdre);

    long countByTenantIdAndChantierIdAndStatusNotIn(
            UUID tenantId, String chantierId, Collection<String> statuses);

    @Query("SELECT COALESCE(SUM(s.netAPayerHt), 0) FROM SituationTravaux s "
            + "WHERE s.tenantId = :tenantId AND s.chantierId = :chantierId "
            + "AND s.status IN ('FACTUREE', 'PAYEE')")
    BigDecimal sumNetAPayerHtFacturee(@Param("tenantId") UUID tenantId, @Param("chantierId") String chantierId);
}
