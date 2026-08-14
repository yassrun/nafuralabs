package ma.nafura.hse.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.hse.domain.model.AuditHseLigne;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AuditHseLigneRepository extends TenantScopedRepository<AuditHseLigne, String> {

    List<AuditHseLigne> findByTenantIdAndAuditIdOrderByOrdreAsc(UUID tenantId, String auditId);

    Optional<AuditHseLigne> findByIdAndTenantIdAndAuditId(String id, UUID tenantId, String auditId);

    long countByTenantIdAndAuditId(UUID tenantId, String auditId);
}
