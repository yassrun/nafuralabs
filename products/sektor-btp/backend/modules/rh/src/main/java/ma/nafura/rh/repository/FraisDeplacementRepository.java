package ma.nafura.rh.repository;

import java.util.List;
import java.util.UUID;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import ma.nafura.rh.domain.model.FraisDeplacement;
import org.springframework.stereotype.Repository;

@Repository
public interface FraisDeplacementRepository extends TenantScopedRepository<FraisDeplacement, String> {

    List<FraisDeplacement> findByTenantIdOrderByDateDescIdDesc(UUID tenantId);

    List<FraisDeplacement> findByTenantIdAndStatusOrderByDateDescIdDesc(UUID tenantId, String status);

    List<FraisDeplacement> findByTenantIdAndEmployeIdOrderByDateDescIdDesc(UUID tenantId, String employeId);

    List<FraisDeplacement> findByTenantIdAndEmployeIdAndStatusOrderByDateDescIdDesc(
            UUID tenantId, String employeId, String status);

    long countByTenantId(UUID tenantId);
}
