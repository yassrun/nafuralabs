package ma.nafura.finance.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.finance.domain.model.Lettrage;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LettrageRepository extends JpaRepository<Lettrage, UUID> {

    List<Lettrage> findByTenantIdOrderByCreatedAtDesc(UUID tenantId);

    Optional<Lettrage> findByTenantIdAndCode(UUID tenantId, String code);

    Optional<Lettrage> findByIdAndTenantId(UUID id, UUID tenantId);
}
