package ma.nafura.marches.repository;

import java.util.List;
import java.util.UUID;
import ma.nafura.marches.domain.model.ReserveReception;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReserveReceptionRepository extends TenantScopedRepository<ReserveReception, String> {

    List<ReserveReception> findByTenantIdAndReceptionIdOrderByCreatedAtAsc(UUID tenantId, String receptionId);

    long countByTenantId(UUID tenantId);
}
