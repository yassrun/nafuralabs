package ma.nafura.etudes.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.etudes.domain.dossier.DossierEtude;
import ma.nafura.etudes.domain.dossier.StatutDossierEtude;
import org.springframework.data.jpa.repository.JpaRepository;

/** Toute requête est scopée par tenant — défaut trouvé au lot 9, ne pas le reproduire. */
public interface DossierEtudeRepository extends JpaRepository<DossierEtude, UUID> {

    List<DossierEtude> findByTenantIdOrderByCreatedAtDesc(UUID tenantId);

    List<DossierEtude> findByTenantIdAndStatusOrderByCreatedAtDesc(
            UUID tenantId, StatutDossierEtude status);

    Optional<DossierEtude> findByIdAndTenantId(UUID id, UUID tenantId);

    Optional<DossierEtude> findByTenantIdAndDpgfId(UUID tenantId, UUID dpgfId);

    Optional<DossierEtude> findByTenantIdAndAppelOffreClientId(UUID tenantId, UUID appelOffreClientId);

    boolean existsByTenantIdAndNumero(UUID tenantId, String numero);

    long countByTenantId(UUID tenantId);
}
