package ma.nafura.hse.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.hse.domain.model.AuditHse;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AuditHseRepository extends TenantScopedRepository<AuditHse, String> {

    Optional<AuditHse> findByTenantIdAndNumero(UUID tenantId, String numero);

    List<AuditHse> findByTenantIdOrderByDateAuditDescCreatedAtDesc(UUID tenantId);

    List<AuditHse> findByTenantIdAndStatusOrderByDateAuditDescCreatedAtDesc(UUID tenantId, String status);

    long countByTenantId(UUID tenantId);
}
