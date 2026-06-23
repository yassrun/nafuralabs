package ma.nafura.hse.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.hse.domain.model.Inspection;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InspectionRepository extends TenantScopedRepository<Inspection, String> {

    Optional<Inspection> findByTenantIdAndNumero(UUID tenantId, String numero);

    List<Inspection> findByTenantIdOrderByDateInspectionDescCreatedAtDesc(UUID tenantId);

    List<Inspection> findByTenantIdAndStatusOrderByDateInspectionDescCreatedAtDesc(UUID tenantId, String status);

    long countByTenantId(UUID tenantId);
}
