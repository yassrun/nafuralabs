package ma.nafura.etudes.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.etudes.domain.model.PrixDpu;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PrixDpuRepository extends JpaRepository<PrixDpu, UUID> {

    Optional<PrixDpu> findByIdAndTenantId(UUID id, UUID tenantId);

    Optional<PrixDpu> findByOuvrageIdAndTenantId(UUID ouvrageId, UUID tenantId);

    List<PrixDpu> findByTenantIdAndOuvrageIdOrderByUpdatedAtDesc(UUID tenantId, UUID ouvrageId);
}
