package ma.nafura.chantiers.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.chantiers.domain.model.BudgetLigne;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BudgetLigneRepository extends TenantScopedRepository<BudgetLigne, String> {

    List<BudgetLigne> findByTenantIdAndBudgetChantierIdOrderByOrdreAscRubriqueAsc(
            UUID tenantId, String budgetChantierId);

    Optional<BudgetLigne> findByTenantIdAndBudgetChantierIdAndRubrique(
            UUID tenantId, String budgetChantierId, String rubrique);

    void deleteByTenantIdAndBudgetChantierId(UUID tenantId, String budgetChantierId);
}
