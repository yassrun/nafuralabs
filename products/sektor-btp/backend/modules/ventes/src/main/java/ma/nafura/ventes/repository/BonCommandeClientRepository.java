package ma.nafura.ventes.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.ventes.domain.model.BonCommandeClient;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BonCommandeClientRepository extends TenantScopedRepository<BonCommandeClient, UUID> {

    Optional<BonCommandeClient> findByTenantIdAndNumero(UUID tenantId, String numero);

    List<BonCommandeClient> findByTenantIdOrderByCreatedAtDesc(UUID tenantId);

    List<BonCommandeClient> findByTenantIdAndStatusOrderByCreatedAtDesc(UUID tenantId, String status);

    List<BonCommandeClient> findByTenantIdAndClientIdOrderByCreatedAtDesc(UUID tenantId, String clientId);

    List<BonCommandeClient> findByTenantIdAndStatusAndClientIdOrderByCreatedAtDesc(
            UUID tenantId, String status, String clientId);

    long countByTenantId(UUID tenantId);
}
