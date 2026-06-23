package ma.nafura.rh.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import ma.nafura.rh.domain.model.PointageBatch;
import org.springframework.stereotype.Repository;

@Repository
public interface PointageBatchRepository extends TenantScopedRepository<PointageBatch, String> {

    Optional<PointageBatch> findByTenantIdAndClientId(UUID tenantId, UUID clientId);

    List<PointageBatch> findByTenantIdAndChantierIdAndDatePointageOrderByCreatedAtDesc(
            UUID tenantId, String chantierId, java.time.LocalDate datePointage);

    long countByTenantId(UUID tenantId);
}
