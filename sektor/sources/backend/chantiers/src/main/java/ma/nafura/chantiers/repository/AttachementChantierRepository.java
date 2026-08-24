package ma.nafura.chantiers.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.chantiers.domain.attachement.AttachementChantier;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AttachementChantierRepository extends TenantScopedRepository<AttachementChantier, String> {

    List<AttachementChantier> findByTenantIdOrderByDateDebutDescCreatedAtDesc(UUID tenantId);

    List<AttachementChantier> findByTenantIdAndChantierIdOrderByDateDebutDescCreatedAtDesc(
            UUID tenantId, String chantierId);

    Optional<AttachementChantier> findByTenantIdAndId(UUID tenantId, String id);

    long countByTenantId(UUID tenantId);

    /**
     * AC-10 — deux attachements d'un même chantier ne chevauchent pas : tout attachement de ce
     * chantier dont la période croise {@code [dateDebut, dateFin]} (bornes incluses).
     */
    List<AttachementChantier> findByTenantIdAndChantierIdAndDateDebutLessThanEqualAndDateFinGreaterThanEqual(
            UUID tenantId, String chantierId, LocalDate dateFin, LocalDate dateDebut);

    /**
     * AC-7 — une déclaration figée : un attachement de ce chantier dont la période couvre cette
     * date et dont le statut n'est plus {@code BROUILLON} ni {@code EN_ATTENTE_MOE} (donc signé
     * ou au-delà, AC-15).
     */
    boolean existsByTenantIdAndChantierIdAndDateDebutLessThanEqualAndDateFinGreaterThanEqualAndStatusIn(
            UUID tenantId, String chantierId, LocalDate dateDebutBorne, LocalDate dateFinBorne, List<String> statuses);

    /**
     * Contrat {@code situation-et-retenues}, AC-1 et AC-4 — les attachements signés (ou au-delà)
     * de ce chantier qu'aucune situation n'a encore consommés, dans l'ordre de leur période.
     */
    List<AttachementChantier> findByTenantIdAndChantierIdAndStatusInAndSituationIdIsNullOrderByDateDebutAsc(
            UUID tenantId, String chantierId, List<String> statuses);
}
