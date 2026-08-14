package ma.nafura.finance.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.finance.domain.model.BankStatement;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BankStatementRepository extends JpaRepository<BankStatement, UUID> {

    List<BankStatement> findByTenantIdOrderByPeriodEndDesc(UUID tenantId);

    List<BankStatement> findByTenantIdAndBankAccountIdOrderByPeriodEndDesc(UUID tenantId, UUID bankAccountId);

    Optional<BankStatement> findByIdAndTenantId(UUID id, UUID tenantId);

    long countByTenantIdAndPeriodEndBetween(UUID tenantId, java.time.LocalDate start, java.time.LocalDate end);

    Optional<BankStatement> findTopByTenantIdOrderByStatementNumberDesc(UUID tenantId);
}
