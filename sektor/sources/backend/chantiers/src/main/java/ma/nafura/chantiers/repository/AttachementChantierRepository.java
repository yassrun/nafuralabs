package ma.nafura.chantiers.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.chantiers.domain.model.AttachementChantier;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AttachementChantierRepository extends TenantScopedRepository<AttachementChantier, String> {

    List<AttachementChantier> findByTenantIdOrderByDateDescCreatedAtDesc(UUID tenantId);

    List<AttachementChantier> findByTenantIdAndChantierIdOrderByDateDescCreatedAtDesc(
            UUID tenantId, String chantierId);

    Optional<AttachementChantier> findByTenantIdAndId(UUID tenantId, String id);

    long countByTenantId(UUID tenantId);
}
