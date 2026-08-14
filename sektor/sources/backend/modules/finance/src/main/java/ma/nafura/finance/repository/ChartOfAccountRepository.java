package ma.nafura.finance.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.finance.domain.model.ChartOfAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface ChartOfAccountRepository
        extends JpaRepository<ChartOfAccount, UUID>, JpaSpecificationExecutor<ChartOfAccount> {

    boolean existsByTenantIdAndCode(UUID tenantId, String code);

    long countByTenantId(UUID tenantId);

    List<ChartOfAccount> findByTenantIdOrderByCodeAsc(UUID tenantId);

    Optional<ChartOfAccount> findByIdAndTenantId(UUID id, UUID tenantId);

    Optional<ChartOfAccount> findByTenantIdAndCode(UUID tenantId, String code);
}
