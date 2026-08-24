package ma.nafura.chantiers.repository;

import java.util.List;
import java.util.UUID;
import ma.nafura.chantiers.domain.chantier.ZoneChantier;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ZoneChantierRepository extends TenantScopedRepository<ZoneChantier, String> {

    List<ZoneChantier> findByTenantIdAndChantierIdOrderByOrdreAscDesignationAsc(UUID tenantId, String chantierId);

    long countByTenantIdAndChantierId(UUID tenantId, String chantierId);
}
