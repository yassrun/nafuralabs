package ma.nafura.rh.repository;

import java.util.List;
import java.util.UUID;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import ma.nafura.rh.domain.model.Formation;
import org.springframework.stereotype.Repository;

@Repository
public interface FormationRepository extends TenantScopedRepository<Formation, String> {

    List<Formation> findByTenantIdOrderByDateDesc(UUID tenantId);

    List<Formation> findByTenantIdAndEmployeIdOrderByDateDesc(UUID tenantId, String employeId);

    long countByTenantId(UUID tenantId);
}
