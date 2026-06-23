package ma.nafura.etudes.repository;

import java.util.List;
import java.util.UUID;
import ma.nafura.etudes.domain.model.DpuVersion;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DpuVersionRepository extends JpaRepository<DpuVersion, UUID> {

    List<DpuVersion> findByPrixDpuIdAndTenantIdOrderBySavedAtDesc(UUID prixDpuId, UUID tenantId);
}
