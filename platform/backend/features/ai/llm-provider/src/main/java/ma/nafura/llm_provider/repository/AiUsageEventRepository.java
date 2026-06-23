package ma.nafura.platform.ai.llm.repository;

import ma.nafura.platform.ai.llm.domain.model.AiUsageEvent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;

@Repository
public interface AiUsageEventRepository extends JpaRepository<AiUsageEvent, Long> {
    Optional<AiUsageEvent> findByScopeKeyAndIdempotencyKey(String scopeKey, String idempotencyKey);

    Page<AiUsageEvent> findByScopeKey(String scopeKey, Pageable pageable);
    
    @Query("SELECT COUNT(e), " +
           "COALESCE(SUM(e.tokensIn), 0), " +
           "COALESCE(SUM(e.tokensOut), 0), " +
           "COALESCE(SUM(e.tokensTotal), 0), " +
           "COALESCE(SUM(e.costUsd), 0) " +
           "FROM AiUsageEvent e " +
           "WHERE (:tenantId IS NULL OR e.tenantId = :tenantId) " +
           "AND (:from IS NULL OR e.createdAt >= :from) " +
           "AND (:to IS NULL OR e.createdAt <= :to)")
    Object[] aggregateUsage(@Param("tenantId") String tenantId, 
                            @Param("from") Instant from, 
                            @Param("to") Instant to);
}

