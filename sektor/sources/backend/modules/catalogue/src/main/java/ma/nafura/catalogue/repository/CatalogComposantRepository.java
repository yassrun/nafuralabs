package ma.nafura.catalogue.repository;

import java.util.List;
import java.util.UUID;
import ma.nafura.catalogue.domain.model.CatalogComposant;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CatalogComposantRepository extends JpaRepository<CatalogComposant, UUID> {
    List<CatalogComposant> findByCatalogOuvrageIdOrderByRangAsc(UUID catalogOuvrageId);
}
