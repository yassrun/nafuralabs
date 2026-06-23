package ma.nafura.finance.repository;

import java.util.List;
import java.util.Set;
import java.util.UUID;
import ma.nafura.finance.domain.model.LettrageLine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface LettrageLineRepository extends JpaRepository<LettrageLine, UUID> {

    List<LettrageLine> findByTenantIdAndLettrageId(UUID tenantId, UUID lettrageId);

    void deleteByTenantIdAndLettrageId(UUID tenantId, UUID lettrageId);

    @Query(
            """
            SELECT CONCAT(l.journalEntryId, '::', l.journalEntryLineId)
            FROM LettrageLine l
            WHERE l.tenantId = :tenantId
            """)
    Set<String> findAllLigneKeys(@Param("tenantId") UUID tenantId);

    boolean existsByTenantIdAndJournalEntryIdAndJournalEntryLineId(
            UUID tenantId, UUID journalEntryId, UUID journalEntryLineId);
}
