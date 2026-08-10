package ma.nafura.catalogue.repository;

import java.util.List;
import java.util.UUID;
import ma.nafura.catalogue.domain.model.CatalogPrixReference;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CatalogPrixReferenceRepository extends JpaRepository<CatalogPrixReference, UUID> {
    List<CatalogPrixReference> findByCatalogArticleCleOrderByValidFromDesc(String catalogArticleCle);
}
