package ma.nafura.marches.repository;

import java.util.List;
import java.util.UUID;
import ma.nafura.marches.domain.model.Avenant;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AvenantRepository extends TenantScopedRepository<Avenant, String> {

    List<Avenant> findByTenantIdOrderByCreatedAtDesc(UUID tenantId);

    List<Avenant> findByTenantIdAndContratMarcheIdOrderByCreatedAtDesc(UUID tenantId, String contratMarcheId);

    List<Avenant> findByTenantIdAndStatusOrderByCreatedAtDesc(UUID tenantId, String status);

    long countByTenantId(UUID tenantId);

    long countByTenantIdAndContratMarcheId(UUID tenantId, String contratMarcheId);
}
