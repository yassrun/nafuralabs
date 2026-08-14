package ma.nafura.finance.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.finance.domain.model.CaisseMouvement;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CaisseMouvementRepository extends JpaRepository<CaisseMouvement, UUID> {

    List<CaisseMouvement> findByTenantIdAndCaisseIdOrderByMovementDateDescCreatedAtDesc(
            UUID tenantId, UUID caisseId);

    Optional<CaisseMouvement> findByIdAndTenantId(UUID id, UUID tenantId);
}
