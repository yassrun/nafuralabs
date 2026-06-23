package ma.nafura.hse.repository;

import java.util.List;
import java.util.UUID;
import ma.nafura.hse.domain.model.Phs;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PhsRepository extends TenantScopedRepository<Phs, String> {

    List<Phs> findByTenantIdOrderByDateRevisionDescCreatedAtDesc(UUID tenantId);

    long countByTenantId(UUID tenantId);
}
