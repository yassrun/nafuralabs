package ma.nafura.achats.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.achats.domain.demande.DemandeAchat;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DemandeAchatRepository extends TenantScopedRepository<DemandeAchat, UUID> {

    List<DemandeAchat> findByTenantIdAndChantierIdAndIdIn(UUID tenantId, String chantierId, java.util.Collection<UUID> ids);

    Optional<DemandeAchat> findByTenantIdAndNumero(UUID tenantId, String numero);

    List<DemandeAchat> findByTenantIdOrderByCreatedAtDesc(UUID tenantId);

    List<DemandeAchat> findByTenantIdAndStatusOrderByCreatedAtDesc(UUID tenantId, String status);

    List<DemandeAchat> findByTenantIdAndChantierIdOrderByCreatedAtDesc(UUID tenantId, String chantierId);

    List<DemandeAchat> findByTenantIdAndStatusAndChantierIdOrderByCreatedAtDesc(
            UUID tenantId, String status, String chantierId);

    long countByTenantId(UUID tenantId);

    long countByTenantIdAndChantierId(UUID tenantId, String chantierId);
}
