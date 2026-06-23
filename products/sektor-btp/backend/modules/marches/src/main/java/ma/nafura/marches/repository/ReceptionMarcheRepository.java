package ma.nafura.marches.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.marches.domain.model.ReceptionMarche;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReceptionMarcheRepository extends TenantScopedRepository<ReceptionMarche, String> {

    List<ReceptionMarche> findByTenantIdAndContratMarcheIdOrderByDateReceptionDescCreatedAtDesc(
            UUID tenantId, String contratMarcheId);

    Optional<ReceptionMarche> findFirstByTenantIdAndContratMarcheIdAndTypeOrderByCreatedAtDesc(
            UUID tenantId, String contratMarcheId, String type);

    long countByTenantId(UUID tenantId);
}
