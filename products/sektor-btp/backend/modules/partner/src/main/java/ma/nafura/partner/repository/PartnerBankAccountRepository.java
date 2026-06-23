package ma.nafura.partner.repository;

import java.util.List;
import java.util.UUID;
import ma.nafura.partner.domain.model.PartnerBankAccount;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PartnerBankAccountRepository extends TenantScopedRepository<PartnerBankAccount, UUID> {

    List<PartnerBankAccount> findByTenantIdAndPartnerIdOrderByBanqueAsc(UUID tenantId, UUID partnerId);
}
