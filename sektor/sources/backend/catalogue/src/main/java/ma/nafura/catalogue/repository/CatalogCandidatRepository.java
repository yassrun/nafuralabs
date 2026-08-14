package ma.nafura.catalogue.repository;

import java.util.List;
import java.util.UUID;
import ma.nafura.catalogue.domain.edition.CatalogCandidat;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CatalogCandidatRepository extends JpaRepository<CatalogCandidat, UUID> {
    List<CatalogCandidat> findByStatutOrderByNbTenantsConfirmantsDescCreatedAtAsc(String statut);
}
