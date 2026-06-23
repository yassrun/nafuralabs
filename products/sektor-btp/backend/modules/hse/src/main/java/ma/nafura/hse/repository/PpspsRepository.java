package ma.nafura.hse.repository;

import java.util.List;
import java.util.UUID;
import ma.nafura.hse.domain.model.Ppsps;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PpspsRepository extends TenantScopedRepository<Ppsps, String> {

    List<Ppsps> findByTenantIdOrderByDateDescCreatedAtDesc(UUID tenantId);

    List<Ppsps> findByTenantIdAndChantierIdOrderByDateDescCreatedAtDesc(UUID tenantId, String chantierId);

    long countByTenantId(UUID tenantId);
}
