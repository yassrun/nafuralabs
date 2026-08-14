package ma.nafura.ventes.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.ventes.domain.model.AvoirClient;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AvoirClientRepository extends TenantScopedRepository<AvoirClient, UUID> {

    Optional<AvoirClient> findByTenantIdAndNumero(UUID tenantId, String numero);

    List<AvoirClient> findByTenantIdOrderByCreatedAtDesc(UUID tenantId);

    List<AvoirClient> findByTenantIdAndStatusOrderByCreatedAtDesc(UUID tenantId, String status);

    List<AvoirClient> findByTenantIdAndClientIdOrderByCreatedAtDesc(UUID tenantId, String clientId);

    List<AvoirClient> findByTenantIdAndFactureOriginaleIdOrderByCreatedAtDesc(
            UUID tenantId, String factureOriginaleId);

    List<AvoirClient> findByTenantIdAndStatusAndClientIdOrderByCreatedAtDesc(
            UUID tenantId, String status, String clientId);

    long countByTenantId(UUID tenantId);
}
