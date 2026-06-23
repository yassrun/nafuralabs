package ma.nafura.finance.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.finance.domain.model.Virement;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VirementRepository extends JpaRepository<Virement, UUID> {

    List<Virement> findByTenantIdAndVirementTypeOrderByVirementDateDesc(UUID tenantId, String virementType);

    List<Virement> findByTenantIdAndVirementTypeAndStatusOrderByVirementDateDesc(
            UUID tenantId, String virementType, String status);

    Optional<Virement> findByIdAndTenantId(UUID id, UUID tenantId);

    Optional<Virement> findTopByTenantIdAndVirementTypeOrderByVirementNumberDesc(
            UUID tenantId, String virementType);
}
