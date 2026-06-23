package ma.nafura.finance.repository;

import java.util.List;
import java.util.UUID;
import ma.nafura.finance.domain.model.JournalEntryLine;
import org.springframework.data.jpa.repository.JpaRepository;

public interface JournalEntryLineRepository extends JpaRepository<JournalEntryLine, UUID> {

    List<JournalEntryLine> findByTenantIdAndJournalEntryIdOrderByLineNumberAsc(
            UUID tenantId, UUID journalEntryId);

    void deleteByTenantIdAndJournalEntryId(UUID tenantId, UUID journalEntryId);
}
