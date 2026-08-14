package ma.nafura.etudes.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.etudes.domain.model.AppelOffreClient;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AppelOffreClientRepository extends TenantScopedRepository<AppelOffreClient, UUID> {

    List<AppelOffreClient> findByTenantIdOrderByDateLimiteDepotDescCreatedAtDesc(UUID tenantId);

    List<AppelOffreClient> findByTenantIdAndStatusOrderByDateLimiteDepotDescCreatedAtDesc(
            UUID tenantId, String status);

    Optional<AppelOffreClient> findByTenantIdAndNumero(UUID tenantId, String numero);

    long countByTenantId(UUID tenantId);

    long countByTenantIdAndNumeroStartingWith(UUID tenantId, String prefix);
}
