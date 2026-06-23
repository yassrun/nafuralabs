package ma.nafura.etudes.repository;

import java.util.List;
import java.util.UUID;
import ma.nafura.etudes.domain.model.ComposantDpu;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ComposantDpuRepository extends JpaRepository<ComposantDpu, UUID> {

    List<ComposantDpu> findByPrixDpuIdAndTenantIdOrderByOrdreAsc(UUID prixDpuId, UUID tenantId);
}
