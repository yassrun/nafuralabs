package ma.nafura.chantiers.repository;

import java.util.List;
import java.util.UUID;
import ma.nafura.chantiers.domain.activite.ActiviteChantier;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ActiviteChantierRepository extends TenantScopedRepository<ActiviteChantier, String> {

    List<ActiviteChantier> findByTenantIdAndChantierIdOrderByOrdreAscLibelleAsc(
            UUID tenantId, String chantierId);

    long countByTenantIdAndChantierId(UUID tenantId, String chantierId);
}
