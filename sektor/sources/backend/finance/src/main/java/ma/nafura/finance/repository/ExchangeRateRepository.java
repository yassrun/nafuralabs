package ma.nafura.finance.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import ma.nafura.finance.domain.devise.ExchangeRate;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Repository for ExchangeRate entity.
 * Generated once — add custom queries here.
 */
@Repository
public interface ExchangeRateRepository extends TenantScopedRepository<ExchangeRate, UUID> {

    @Query(
            """
            SELECT r FROM ExchangeRate r
            WHERE r.tenantId = :tenantId
              AND r.fromCurrencyId = :fromCurrencyId
              AND r.toCurrencyId = :toCurrencyId
              AND r.effectiveDate <= :date
            ORDER BY r.effectiveDate DESC
            """)
    List<ExchangeRate> findRatesAtOrBefore(
            @Param("tenantId") UUID tenantId,
            @Param("fromCurrencyId") UUID fromCurrencyId,
            @Param("toCurrencyId") UUID toCurrencyId,
            @Param("date") LocalDate date);
}
