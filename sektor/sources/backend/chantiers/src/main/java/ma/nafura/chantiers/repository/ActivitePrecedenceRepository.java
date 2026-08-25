package ma.nafura.chantiers.repository;

import java.util.List;
import java.util.UUID;
import ma.nafura.chantiers.domain.activite.ActivitePrecedence;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ActivitePrecedenceRepository extends TenantScopedRepository<ActivitePrecedence, String> {

    List<ActivitePrecedence> findByTenantIdAndChantierId(UUID tenantId, String chantierId);

    List<ActivitePrecedence> findByTenantIdAndPredActiviteId(UUID tenantId, String predActiviteId);

    List<ActivitePrecedence> findByTenantIdAndSuccActiviteId(UUID tenantId, String succActiviteId);
}
