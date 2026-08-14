package ma.nafura.achats.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.achats.domain.model.AttestationFournisseur;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AttestationFournisseurRepository extends TenantScopedRepository<AttestationFournisseur, UUID> {

    List<AttestationFournisseur> findByTenantIdOrderByCreatedAtDesc(UUID tenantId);

    List<AttestationFournisseur> findByTenantIdAndPartnerIdOrderByCreatedAtDesc(UUID tenantId, String partnerId);

    List<AttestationFournisseur> findByTenantIdAndStatusOrderByCreatedAtDesc(UUID tenantId, String status);

    List<AttestationFournisseur> findByTenantIdAndPartnerIdAndStatusOrderByCreatedAtDesc(
            UUID tenantId, String partnerId, String status);

    Optional<AttestationFournisseur> findByTenantIdAndPartnerIdAndType(
            UUID tenantId, String partnerId, String type);
}
