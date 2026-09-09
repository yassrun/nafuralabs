package ma.nafura.chantiers.repository;

import java.util.List;
import ma.nafura.chantiers.domain.activite.ActiviteNature;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ActiviteNatureRepository extends JpaRepository<ActiviteNature, String> {

    List<ActiviteNature> findByActifTrueOrderByOrdreAscLibelleAsc();
}
