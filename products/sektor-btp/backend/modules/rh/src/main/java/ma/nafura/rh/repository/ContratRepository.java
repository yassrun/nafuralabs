package ma.nafura.rh.repository;

import java.util.List;
import java.util.UUID;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import ma.nafura.rh.domain.model.Contrat;
import org.springframework.stereotype.Repository;

@Repository
public interface ContratRepository extends TenantScopedRepository<Contrat, String> {

    List<Contrat> findByTenantIdOrderByDateDebutDesc(UUID tenantId);

    List<Contrat> findByTenantIdAndEmployeIdOrderByDateDebutDesc(UUID tenantId, String employeId);

    List<Contrat> findByTenantIdAndStatusOrderByDateDebutDesc(UUID tenantId, String status);

    List<Contrat> findByTenantIdAndEmployeIdAndStatusOrderByDateDebutDesc(
            UUID tenantId, String employeId, String status);

    long countByTenantId(UUID tenantId);
}
