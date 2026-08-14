package ma.nafura.socle.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.socle.domain.model.DelegationApprobation;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DelegationApprobationRepository extends JpaRepository<DelegationApprobation, UUID> {

    List<DelegationApprobation> findByTenantIdOrderByDateDebutDesc(UUID tenantId);

    List<DelegationApprobation> findByTenantIdAndUserIdOrderByDateDebutDesc(UUID tenantId, String userId);

    Optional<DelegationApprobation> findByIdAndTenantId(UUID id, UUID tenantId);

    long countByTenantId(UUID tenantId);
}
