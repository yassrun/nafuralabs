package ma.nafura.chantiers.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.chantiers.domain.model.Chantier;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ChantierRepository extends TenantScopedRepository<Chantier, String> {

    Optional<Chantier> findByTenantIdAndCode(UUID tenantId, String code);

    List<Chantier> findByTenantIdOrderByCodeAsc(UUID tenantId);

    List<Chantier> findByTenantIdAndStatusOrderByCodeAsc(UUID tenantId, String status);

    List<Chantier> findByTenantIdAndClientIdOrderByCodeAsc(UUID tenantId, String clientId);

    List<Chantier> findByTenantIdAndSocieteIdOrderByCodeAsc(UUID tenantId, String societeId);

    List<Chantier> findByTenantIdAndStatusAndClientIdOrderByCodeAsc(
            UUID tenantId, String status, String clientId);

    List<Chantier> findByTenantIdAndStatusAndSocieteIdOrderByCodeAsc(
            UUID tenantId, String status, String societeId);

    long countByTenantId(UUID tenantId);
}
