package ma.nafura.finance.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.finance.domain.model.JournalEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface JournalEntryRepository
        extends JpaRepository<JournalEntry, UUID>, JpaSpecificationExecutor<JournalEntry> {

    List<JournalEntry> findByTenantIdAndFiscalYearOrderByEntryNumberDesc(UUID tenantId, Integer fiscalYear);

    Optional<JournalEntry> findByIdAndTenantId(UUID id, UUID tenantId);

    List<JournalEntry> findByTenantIdAndStatusNotOrderByEntryDateDesc(UUID tenantId, String status);
}
