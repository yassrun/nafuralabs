package ma.nafura.finance.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.finance.domain.model.AccountingJournal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface AccountingJournalRepository
        extends JpaRepository<AccountingJournal, UUID>, JpaSpecificationExecutor<AccountingJournal> {

    boolean existsByTenantIdAndCode(UUID tenantId, String code);

    long countByTenantId(UUID tenantId);

    List<AccountingJournal> findByTenantIdOrderByCodeAsc(UUID tenantId);

    Optional<AccountingJournal> findByIdAndTenantId(UUID id, UUID tenantId);

    Optional<AccountingJournal> findByTenantIdAndCode(UUID tenantId, String code);
}
