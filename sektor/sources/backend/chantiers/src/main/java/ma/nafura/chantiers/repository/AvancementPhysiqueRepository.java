package ma.nafura.chantiers.repository;

import java.util.List;
import java.util.UUID;
import ma.nafura.chantiers.domain.model.AvancementPhysique;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AvancementPhysiqueRepository extends TenantScopedRepository<AvancementPhysique, String> {

    List<AvancementPhysique> findByTenantIdAndChantierIdOrderByDateSaisieDescCreatedAtDesc(
            UUID tenantId, String chantierId);

    List<AvancementPhysique> findByTenantIdAndLotIdOrderByDateSaisieAscCreatedAtAsc(
            UUID tenantId, String lotId);

    long countByTenantId(UUID tenantId);

    List<AvancementPhysique> findByTenantIdAndChantierIdAndStatusOrderByDateSaisieAscCreatedAtAsc(
            UUID tenantId, String chantierId, String status);
}
