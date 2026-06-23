package ma.nafura.ventes.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.ventes.domain.model.FactureClient;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FactureClientRepository extends TenantScopedRepository<FactureClient, UUID> {

    Optional<FactureClient> findByTenantIdAndNumero(UUID tenantId, String numero);

    List<FactureClient> findByTenantIdOrderByCreatedAtDesc(UUID tenantId);

    List<FactureClient> findByTenantIdAndStatusOrderByCreatedAtDesc(UUID tenantId, String status);

    List<FactureClient> findByTenantIdAndClientIdOrderByCreatedAtDesc(UUID tenantId, String clientId);

    List<FactureClient> findByTenantIdAndStatusAndClientIdOrderByCreatedAtDesc(
            UUID tenantId, String status, String clientId);

    long countByTenantId(UUID tenantId);
}
