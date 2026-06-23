package ma.nafura.etudes.repository;

import java.util.List;
import java.util.UUID;
import ma.nafura.etudes.domain.model.Devis;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DevisRepository extends TenantScopedRepository<Devis, UUID> {

    List<Devis> findByTenantIdOrderByDateEmissionDescCreatedAtDesc(UUID tenantId);

    List<Devis> findByTenantIdAndStatusOrderByDateEmissionDescCreatedAtDesc(UUID tenantId, String status);

    List<Devis> findByTenantIdAndClientIdOrderByDateEmissionDescCreatedAtDesc(UUID tenantId, String clientId);

    long countByTenantId(UUID tenantId);

    long countByTenantIdAndNumeroStartingWith(UUID tenantId, String prefix);
}
