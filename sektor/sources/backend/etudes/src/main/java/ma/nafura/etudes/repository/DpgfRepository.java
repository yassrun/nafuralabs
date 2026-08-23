package ma.nafura.etudes.repository;

import java.util.List;
import java.util.UUID;
import ma.nafura.etudes.domain.dpgf.Dpgf;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DpgfRepository extends TenantScopedRepository<Dpgf, UUID> {

    List<Dpgf> findByTenantIdOrderByCreatedAtDesc(UUID tenantId);

    long countByTenantIdAndNumeroStartingWith(UUID tenantId, String prefix);
}
