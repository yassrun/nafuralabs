package ma.nafura.chantiers.repository;

import java.util.List;
import java.util.UUID;
import ma.nafura.chantiers.domain.model.PhotoChantier;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PhotoChantierRepository extends TenantScopedRepository<PhotoChantier, String> {

    List<PhotoChantier> findByTenantIdAndChantierIdOrderByTakenAtDescCreatedAtDesc(
            UUID tenantId, String chantierId);

    long countByTenantId(UUID tenantId);
}
