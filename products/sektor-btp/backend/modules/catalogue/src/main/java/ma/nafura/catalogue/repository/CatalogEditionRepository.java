package ma.nafura.catalogue.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.catalogue.domain.model.CatalogEdition;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CatalogEditionRepository extends JpaRepository<CatalogEdition, UUID> {
    Optional<CatalogEdition> findByCode(String code);

    List<CatalogEdition> findAllByOrderByCodeDesc();
}
