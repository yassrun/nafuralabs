package ma.nafura.partner.repository;

import java.util.List;
import java.util.UUID;
import ma.nafura.partner.domain.model.PartnerContact;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PartnerContactRepository extends TenantScopedRepository<PartnerContact, UUID> {

    List<PartnerContact> findByTenantIdAndPartnerIdOrderByNomAsc(UUID tenantId, UUID partnerId);
}
