package ma.nafura.finance.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.finance.domain.model.BankAccount;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BankAccountRepository extends JpaRepository<BankAccount, UUID> {

    long countByTenantId(UUID tenantId);

    List<BankAccount> findByTenantIdOrderByCodeAsc(UUID tenantId);

    Optional<BankAccount> findByIdAndTenantId(UUID id, UUID tenantId);
}
