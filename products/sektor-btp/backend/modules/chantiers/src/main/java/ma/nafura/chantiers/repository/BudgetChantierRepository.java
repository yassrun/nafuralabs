package ma.nafura.chantiers.repository;

import java.util.Optional;
import java.util.UUID;
import ma.nafura.chantiers.domain.model.BudgetChantier;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BudgetChantierRepository extends TenantScopedRepository<BudgetChantier, String> {

    Optional<BudgetChantier> findByTenantIdAndChantierId(UUID tenantId, String chantierId);
}
