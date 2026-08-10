package ma.nafura.etudes.service;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import ma.nafura.etudes.domain.RoleIntervenant;
import ma.nafura.etudes.domain.model.DossierIntervenant;
import ma.nafura.etudes.repository.DossierIntervenantRepository;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.context.UserContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * Trace des intervenants d'un dossier — base du garde-fou quatre yeux (L4).
 */
@Service
public class DossierIntervenantService {

    private static final List<String> ROLES_BLOQUANTS = List.of(
            RoleIntervenant.CHARGE_ETUDE.name(), RoleIntervenant.REVISEUR.name());

    private final DossierIntervenantRepository repository;

    public DossierIntervenantService(DossierIntervenantRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<DossierIntervenant> list(UUID dossierId) {
        return repository.findByTenantIdAndDossierEtudeId(tenantId(), dossierId);
    }

    /**
     * True si l'utilisateur est CHARGE_ETUDE ou REVISEUR sur ce dossier.
     * Le rôle AVIS ne bloque pas.
     */
    @Transactional(readOnly = true)
    public boolean bloqueApprobation(UUID dossierId, String userId) {
        if (!StringUtils.hasText(userId)) {
            return false;
        }
        return repository.existsByTenantIdAndDossierEtudeIdAndUserIdAndRoleIn(
                tenantId(), dossierId, userId.trim(), ROLES_BLOQUANTS);
    }

    @Transactional
    public void upsertChargeEtude(UUID dossierId, String userId, String nom) {
        upsert(dossierId, userId, nom, RoleIntervenant.CHARGE_ETUDE, true);
    }

    @Transactional
    public void enregistrerReviseur(UUID dossierId) {
        String userId = currentUserId();
        if (!StringUtils.hasText(userId) || "system".equals(userId)) {
            return;
        }
        upsert(dossierId, userId, currentUserLabel(), RoleIntervenant.REVISEUR, false);
    }

    @Transactional
    public void enregistrerReviseur(UUID dossierId, String userId, String nom) {
        upsert(dossierId, userId, nom, RoleIntervenant.REVISEUR, false);
    }

    @Transactional
    public void enregistrerApprobateur(UUID dossierId, String userId, String nom) {
        upsert(dossierId, userId, nom, RoleIntervenant.APPROBATEUR, false);
    }

    /** Invitation / trace avis — ne bloque pas l'approbation. */
    @Transactional
    public void enregistrerAvis(UUID dossierId, String userId, String nom, boolean invite) {
        upsert(dossierId, userId, nom, RoleIntervenant.AVIS, invite);
    }

    private void upsert(
            UUID dossierId, String userId, String nom, RoleIntervenant role, boolean invite) {
        if (dossierId == null || !StringUtils.hasText(userId) || role == null) {
            return;
        }
        String uid = userId.trim();
        UUID tenant = tenantId();
        OffsetDateTime now = OffsetDateTime.now();
        repository
                .findByTenantIdAndDossierEtudeIdAndUserIdAndRole(tenant, dossierId, uid, role.name())
                .ifPresentOrElse(
                        existing -> {
                            if (StringUtils.hasText(nom)) {
                                existing.setNom(nom.trim());
                            }
                            if (invite) {
                                existing.setInvite(true);
                            }
                            existing.setDerniereActionAt(now);
                            repository.save(existing);
                        },
                        () -> repository.save(DossierIntervenant.builder()
                                .tenantId(tenant)
                                .dossierEtudeId(dossierId)
                                .userId(uid)
                                .nom(StringUtils.hasText(nom) ? nom.trim() : uid)
                                .role(role.name())
                                .invite(invite)
                                .premiereActionAt(now)
                                .derniereActionAt(now)
                                .build()));
    }

    private static String currentUserId() {
        UUID id = UserContext.getUserIdOrNull();
        if (id != null) {
            return id.toString();
        }
        String email = UserContext.getUserEmail();
        return StringUtils.hasText(email) ? email : null;
    }

    private static String currentUserLabel() {
        String email = UserContext.getUserEmail();
        if (StringUtils.hasText(email)) {
            return email;
        }
        return currentUserId();
    }

    private UUID tenantId() {
        return TenantContext.getTenantId();
    }
}
