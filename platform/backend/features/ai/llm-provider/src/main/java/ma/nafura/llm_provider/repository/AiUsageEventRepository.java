package ma.nafura.platform.ai.llm.repository;

import ma.nafura.platform.ai.llm.domain.model.AiUsageEvent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface AiUsageEventRepository extends JpaRepository<AiUsageEvent, Long> {
    Optional<AiUsageEvent> findByScopeKeyAndIdempotencyKey(String scopeKey, String idempotencyKey);

    Page<AiUsageEvent> findByScopeKey(String scopeKey, Pageable pageable);
    
    /**
     * Callers must pass non-null {@code from}/{@code to}. PostgreSQL cannot infer JDBC types for
     * {@code (:from IS NULL OR e.createdAt >= :from)} with Instant parameters.
     */
    @Query("SELECT COUNT(e), " +
           "COALESCE(SUM(e.tokensIn), 0), " +
           "COALESCE(SUM(e.tokensOut), 0), " +
           "COALESCE(SUM(e.tokensTotal), 0), " +
           "COALESCE(SUM(e.costUsd), 0) " +
           "FROM AiUsageEvent e " +
           "WHERE (:tenantId IS NULL OR e.tenantId = :tenantId) " +
           "AND e.createdAt >= :from " +
           "AND e.createdAt <= :to")
    Object[] aggregateUsage(@Param("tenantId") String tenantId, 
                            @Param("from") Instant from, 
                            @Param("to") Instant to);

    @Query("SELECT e.tenantId, COUNT(e), " +
           "COALESCE(SUM(e.tokensIn), 0), " +
           "COALESCE(SUM(e.tokensOut), 0), " +
           "COALESCE(SUM(e.tokensTotal), 0), " +
           "COALESCE(SUM(e.costUsd), 0) " +
           "FROM AiUsageEvent e " +
           "WHERE e.createdAt >= :from " +
           "AND e.createdAt <= :to " +
           "AND e.tenantId IS NOT NULL " +
           "GROUP BY e.tenantId")
    List<Object[]> aggregateUsageByTenant(@Param("from") Instant from, @Param("to") Instant to);

    @Query("SELECT FUNCTION('date_trunc', 'day', e.createdAt), COUNT(e), " +
           "COALESCE(SUM(e.tokensTotal), 0), " +
           "COALESCE(SUM(e.costUsd), 0) " +
           "FROM AiUsageEvent e " +
           "WHERE (:tenantId IS NULL OR e.tenantId = :tenantId) " +
           "AND e.createdAt >= :from " +
           "AND e.createdAt <= :to " +
           "GROUP BY FUNCTION('date_trunc', 'day', e.createdAt) " +
           "ORDER BY FUNCTION('date_trunc', 'day', e.createdAt)")
    List<Object[]> aggregateUsageTimeseries(@Param("tenantId") String tenantId,
                                            @Param("from") Instant from,
                                            @Param("to") Instant to);

    @Query("SELECT e.applicationId, e.featureKey, COUNT(e), " +
           "COALESCE(SUM(e.tokensTotal), 0), " +
           "COALESCE(SUM(e.costUsd), 0) " +
           "FROM AiUsageEvent e " +
           "WHERE (:tenantId IS NULL OR e.tenantId = :tenantId) " +
           "AND e.createdAt >= :from " +
           "AND e.createdAt <= :to " +
           "GROUP BY e.applicationId, e.featureKey")
    List<Object[]> aggregateUsageByFeature(@Param("tenantId") String tenantId,
                                           @Param("from") Instant from,
                                           @Param("to") Instant to);
}

