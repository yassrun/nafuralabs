package ma.nafura.catalogue.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.catalogue.domain.ouvrage.CatalogOuvrage;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CatalogOuvrageRepository extends JpaRepository<CatalogOuvrage, UUID> {
    Optional<CatalogOuvrage> findByCleStable(String cleStable);

    List<CatalogOuvrage> findByStatutOrderByLibelleAsc(String statut);

    boolean existsByCleStable(String cleStable);
}
