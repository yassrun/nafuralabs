package ma.nafura.chantiers.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.chantiers.domain.budget.DebourseNoeud;
import ma.nafura.chantiers.domain.budget.RubriqueDebourse;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DebourseNoeudRepository extends TenantScopedRepository<DebourseNoeud, String> {

    List<DebourseNoeud> findByTenantIdAndPosteIdOrderByRubriqueAsc(UUID tenantId, String posteId);

    /** Lecture en une passe pour le rollup d'un chantier entier (AC-9). */
    List<DebourseNoeud> findByTenantIdAndPosteIdIn(UUID tenantId, Collection<String> posteIds);

    Optional<DebourseNoeud> findByTenantIdAndPosteIdAndRubrique(
            UUID tenantId, String posteId, RubriqueDebourse rubrique);

    void deleteByTenantIdAndPosteId(UUID tenantId, String posteId);
}
