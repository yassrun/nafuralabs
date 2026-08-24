package ma.nafura.chantiers.repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;
import ma.nafura.chantiers.domain.budget.CoutReelNoeud;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CoutReelNoeudRepository extends TenantScopedRepository<CoutReelNoeud, String> {

    List<CoutReelNoeud> findByTenantIdAndChantierIdOrderByDateCoutDescCreatedAtDesc(
            UUID tenantId, String chantierId);

    List<CoutReelNoeud> findByTenantIdAndPosteIdIn(UUID tenantId, Collection<String> posteIds);

    long countByTenantIdAndChantierId(UUID tenantId, String chantierId);
}
