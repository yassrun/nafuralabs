package ma.nafura.marches.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.marches.domain.model.IndiceBtp;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface IndiceBtpRepository extends TenantScopedRepository<IndiceBtp, String> {

    List<IndiceBtp> findByTenantIdAndPeriodeOrderByCodeAsc(UUID tenantId, String periode);

    Optional<IndiceBtp> findByTenantIdAndCodeAndPeriode(UUID tenantId, String code, String periode);

    long countByTenantId(UUID tenantId);
}
