package ma.nafura.catalogue.repository;

import java.util.UUID;
import ma.nafura.catalogue.domain.edition.CatalogCandidatSignal;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CatalogCandidatSignalRepository extends JpaRepository<CatalogCandidatSignal, UUID> {

    boolean existsByCandidatIdAndTenantHash(UUID candidatId, String tenantHash);

    long countByCandidatId(UUID candidatId);
}
