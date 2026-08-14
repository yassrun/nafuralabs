package ma.nafura.finance.repository;

import java.util.List;
import java.util.UUID;
import ma.nafura.finance.domain.model.VirementLine;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VirementLineRepository extends JpaRepository<VirementLine, UUID> {

    List<VirementLine> findByTenantIdAndVirementIdOrderByLineNumberAsc(UUID tenantId, UUID virementId);

    void deleteByTenantIdAndVirementId(UUID tenantId, UUID virementId);
}
