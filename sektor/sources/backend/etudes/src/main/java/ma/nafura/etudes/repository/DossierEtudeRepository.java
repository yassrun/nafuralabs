package ma.nafura.etudes.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.etudes.domain.dossier.DossierEtude;
import ma.nafura.etudes.domain.dossier.StatutDossierEtude;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** Toute requête est scopée par tenant — défaut trouvé au lot 9, ne pas le reproduire. */
public interface DossierEtudeRepository extends JpaRepository<DossierEtude, UUID> {

    List<DossierEtude> findByTenantIdOrderByCreatedAtDesc(UUID tenantId);

    List<DossierEtude> findByTenantIdAndStatusOrderByCreatedAtDesc(
            UUID tenantId, StatutDossierEtude status);

    Optional<DossierEtude> findByIdAndTenantId(UUID id, UUID tenantId);

    /**
     * AC-9 — deux appels concurrents ne produisent pas deux chantiers : le second attend le
     * premier sur la ligne du dossier, et le trouve alors déjà converti.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select d from DossierEtude d where d.id = :id and d.tenantId = :tenantId")
    Optional<DossierEtude> lockByIdAndTenantId(@Param("id") UUID id, @Param("tenantId") UUID tenantId);

    Optional<DossierEtude> findByTenantIdAndDpgfId(UUID tenantId, UUID dpgfId);

    Optional<DossierEtude> findByTenantIdAndAppelOffreClientId(UUID tenantId, UUID appelOffreClientId);

    boolean existsByTenantIdAndNumero(UUID tenantId, String numero);

    long countByTenantId(UUID tenantId);
}
