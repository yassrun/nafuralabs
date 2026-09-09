package ma.nafura.chantiers.repository;

import java.util.Optional;
import java.util.UUID;
import ma.nafura.chantiers.domain.calendrier.CalendrierChantier;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CalendrierChantierRepository extends TenantScopedRepository<CalendrierChantier, String> {

    Optional<CalendrierChantier> findByTenantIdAndChantierId(UUID tenantId, String chantierId);
}
