package ma.nafura.hse.repository;

import java.util.List;
import java.util.UUID;
import ma.nafura.hse.domain.model.RegistreLegal;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RegistreLegalRepository extends TenantScopedRepository<RegistreLegal, String> {

    List<RegistreLegal> findByTenantIdOrderByDateDescCreatedAtDesc(UUID tenantId);

    List<RegistreLegal> findByTenantIdAndChantierIdOrderByDateDescCreatedAtDesc(UUID tenantId, String chantierId);

    List<RegistreLegal> findByTenantIdAndRegistreOrderByDateDescCreatedAtDesc(UUID tenantId, String registre);

    long countByTenantId(UUID tenantId);
}
