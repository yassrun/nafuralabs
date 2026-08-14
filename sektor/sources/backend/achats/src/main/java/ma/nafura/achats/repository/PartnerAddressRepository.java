package ma.nafura.achats.repository;

import java.util.List;
import java.util.UUID;
import ma.nafura.achats.domain.fournisseur.PartnerAddress;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PartnerAddressRepository extends TenantScopedRepository<PartnerAddress, UUID> {

    List<PartnerAddress> findByTenantIdAndPartnerIdOrderByTypeAsc(UUID tenantId, UUID partnerId);
}
