package ma.nafura.partner.repository;

import java.util.List;
import java.util.UUID;
import ma.nafura.partner.domain.model.PartnerRole;
import ma.nafura.partner.domain.model.PartnerRoleType;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PartnerRoleRepository extends TenantScopedRepository<PartnerRole, UUID> {

    List<PartnerRole> findByTenantIdAndPartnerId(UUID tenantId, UUID partnerId);

    boolean existsByTenantIdAndPartnerIdAndRole(UUID tenantId, UUID partnerId, PartnerRoleType role);

    void deleteByTenantIdAndPartnerIdAndRole(UUID tenantId, UUID partnerId, PartnerRoleType role);
}
