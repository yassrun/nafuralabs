package ma.nafura.finance.repository;

import java.util.List;
import java.util.UUID;
import ma.nafura.finance.domain.model.ReglementImputation;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReglementImputationRepository extends JpaRepository<ReglementImputation, UUID> {

    List<ReglementImputation> findByTenantIdAndReglementIdOrderByFactureDateAsc(
            UUID tenantId, UUID reglementId);

    void deleteByTenantIdAndReglementId(UUID tenantId, UUID reglementId);
}
