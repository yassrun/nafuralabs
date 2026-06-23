package ma.nafura.finance.repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import ma.nafura.finance.domain.model.BankStatementLine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BankStatementLineRepository extends JpaRepository<BankStatementLine, UUID> {

    List<BankStatementLine> findByTenantIdAndBankStatementIdOrderByLineDateAsc(
            UUID tenantId, UUID bankStatementId);

    Optional<BankStatementLine> findByIdAndTenantId(UUID id, UUID tenantId);

    void deleteByTenantIdAndBankStatementId(UUID tenantId, UUID bankStatementId);

    @Query(
            """
            SELECT l.matchedJournalEntryLineId FROM BankStatementLine l
            WHERE l.tenantId = :tenantId
              AND l.matchedJournalEntryLineId IS NOT NULL
              AND (:excludeStatementId IS NULL OR l.bankStatementId <> :excludeStatementId)
            """)
    Set<UUID> findMatchedJournalLineIds(
            @Param("tenantId") UUID tenantId, @Param("excludeStatementId") UUID excludeStatementId);
}
