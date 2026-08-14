package ma.nafura.catalogue.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.catalogue.domain.ouvrage.CatalogArticle;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CatalogArticleRepository extends JpaRepository<CatalogArticle, UUID> {
    Optional<CatalogArticle> findByCleStable(String cleStable);

    List<CatalogArticle> findByStatutOrderByLibelleAsc(String statut);

    boolean existsByCleStable(String cleStable);
}
