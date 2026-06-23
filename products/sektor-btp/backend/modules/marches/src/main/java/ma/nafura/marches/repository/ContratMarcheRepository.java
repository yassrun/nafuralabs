package ma.nafura.marches.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.marches.domain.model.ContratMarche;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ContratMarcheRepository extends TenantScopedRepository<ContratMarche, String> {

    Optional<ContratMarche> findByTenantIdAndNumero(UUID tenantId, String numero);

    List<ContratMarche> findByTenantIdOrderByCreatedAtDesc(UUID tenantId);

    List<ContratMarche> findByTenantIdAndStatusOrderByCreatedAtDesc(UUID tenantId, String status);

    List<ContratMarche> findByTenantIdAndChantierIdOrderByCreatedAtDesc(UUID tenantId, String chantierId);

    List<ContratMarche> findByTenantIdAndClientIdOrderByCreatedAtDesc(UUID tenantId, String clientId);

    List<ContratMarche> findByTenantIdAndStatusAndChantierIdOrderByCreatedAtDesc(
            UUID tenantId, String status, String chantierId);

    long countByTenantId(UUID tenantId);
}
