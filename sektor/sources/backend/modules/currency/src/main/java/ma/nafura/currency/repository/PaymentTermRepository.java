package ma.nafura.currency.repository;

import ma.nafura.currency.domain.model.PaymentTerm;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

/**
 * Repository for PaymentTerm entity.
 * Generated once — add custom queries here.
 */
@Repository
public interface PaymentTermRepository extends TenantScopedRepository<PaymentTerm, UUID> {
}
