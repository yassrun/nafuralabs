package ma.nafura.hse.repository;

import java.util.List;
import java.util.UUID;
import ma.nafura.hse.domain.model.CapaAction;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CapaActionRepository extends TenantScopedRepository<CapaAction, String> {

    List<CapaAction> findByTenantIdAndNonConformiteIdOrderByCreatedAtAsc(UUID tenantId, String nonConformiteId);
}
