package ma.nafura.etudes.repository;

import java.util.List;
import java.util.UUID;
import ma.nafura.etudes.domain.model.DevisVersion;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DevisVersionRepository extends TenantScopedRepository<DevisVersion, UUID> {

    List<DevisVersion> findByDevisIdAndTenantIdOrderByVersionAsc(UUID devisId, UUID tenantId);
}
