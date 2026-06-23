package ma.nafura.etudes.repository;

import java.util.List;
import java.util.UUID;
import ma.nafura.etudes.domain.model.Dpgf;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DpgfRepository extends TenantScopedRepository<Dpgf, UUID> {

    List<Dpgf> findByTenantIdOrderByCreatedAtDesc(UUID tenantId);

    List<Dpgf> findByTenantIdAndMetreIdOrderByCreatedAtDesc(UUID tenantId, UUID metreId);

    long countByTenantIdAndNumeroStartingWith(UUID tenantId, String prefix);
}
