package ma.nafura.rh.repository;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import ma.nafura.rh.domain.temps.PointageBatch;
import org.springframework.stereotype.Repository;

@Repository
public interface PointageBatchRepository extends TenantScopedRepository<PointageBatch, UUID> {

    Optional<PointageBatch> findByTenantIdAndClientId(UUID tenantId, UUID clientId);

    Optional<PointageBatch> findByTenantIdAndChantierIdAndDatePointage(
            UUID tenantId, String chantierId, LocalDate datePointage);

    boolean existsByTenantIdAndChantierIdAndDatePointage(
            UUID tenantId, String chantierId, LocalDate datePointage);

    long countByTenantId(UUID tenantId);
}
