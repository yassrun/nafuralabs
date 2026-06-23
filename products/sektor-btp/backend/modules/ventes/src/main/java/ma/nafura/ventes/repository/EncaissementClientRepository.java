package ma.nafura.ventes.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.ventes.domain.model.EncaissementClient;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EncaissementClientRepository extends TenantScopedRepository<EncaissementClient, UUID> {

    List<EncaissementClient> findByTenantIdAndFacture_IdOrderByDateEncaissementAscCreatedAtAsc(
            UUID tenantId, UUID factureId);

    Optional<EncaissementClient> findByIdAndTenantIdAndFacture_Id(UUID id, UUID tenantId, UUID factureId);
}
