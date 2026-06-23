package ma.nafura.ventes.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.ventes.domain.model.RetenueGarantie;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RetenueGarantieRepository extends TenantScopedRepository<RetenueGarantie, UUID> {

    List<RetenueGarantie> findByTenantIdOrderByCreatedAtDesc(UUID tenantId);

    List<RetenueGarantie> findByTenantIdAndMarcheIdOrderByCreatedAtDesc(UUID tenantId, String marcheId);

    List<RetenueGarantie> findByTenantIdAndStatutOrderByCreatedAtDesc(UUID tenantId, String statut);

    List<RetenueGarantie> findByTenantIdAndClientIdOrderByCreatedAtDesc(UUID tenantId, String clientId);

    List<RetenueGarantie> findByTenantIdAndMarcheIdAndStatutOrderByCreatedAtDesc(
            UUID tenantId, String marcheId, String statut);

    List<RetenueGarantie> findByTenantIdAndClientIdAndStatutOrderByCreatedAtDesc(
            UUID tenantId, String clientId, String statut);

    Optional<RetenueGarantie> findByTenantIdAndMarcheId(UUID tenantId, String marcheId);

    long countByTenantId(UUID tenantId);
}
