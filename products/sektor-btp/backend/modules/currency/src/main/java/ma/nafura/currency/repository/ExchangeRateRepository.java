package ma.nafura.currency.repository;

import ma.nafura.currency.domain.model.ExchangeRate;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

/**
 * Repository for ExchangeRate entity.
 * Generated once — add custom queries here.
 */
@Repository
public interface ExchangeRateRepository extends TenantScopedRepository<ExchangeRate, UUID> {
}
