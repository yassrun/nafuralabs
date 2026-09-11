package ma.nafura.etudes.service;

import ma.nafura.etudes.domain.dossier.DossierEtude;
import ma.nafura.etudes.domain.dossier.StatutDossierEtude;
import ma.nafura.platform.framework.context.UserContext;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * Qui peut saisir après le go : le chargé d'étude affecté, ou le DG / owner.
 */
@Component
public class EtudeSaisiePolicy {

    public boolean peutDeciderGo() {
        if (UserContext.isOwnerOrSuperAdmin()) {
            return true;
        }
        String role = UserContext.getUserRole();
        return role != null && "BTP_DG".equalsIgnoreCase(role);
    }

    public void assertPeutSaisirApresGo(DossierEtude dossier) {
        if (dossier == null
                || (dossier.getStatus() != StatutDossierEtude.EN_ETUDE
                        && dossier.getStatus() != StatutDossierEtude.SUSPENDU)) {
            return;
        }
        if (peutDeciderGo() || estChargeEtudeCourant(dossier)) {
            return;
        }
        throw new IllegalStateException("etudes.dossier.saisie_reservee_charge");
    }

    public boolean estChargeEtudeCourant(DossierEtude dossier) {
        return estMemeActeur(dossier != null ? dossier.getChargeEtudeUserId() : null);
    }

    public boolean estResponsableExecutionCourant(DossierEtude dossier) {
        return estMemeActeur(dossier != null ? dossier.getResponsableExecutionUserId() : null);
    }

    public void assertPeutAvisExecution(DossierEtude dossier) {
        if (peutDeciderGo() || estResponsableExecutionCourant(dossier)) {
            return;
        }
        throw new IllegalStateException("etudes.dossier.avis_reserve_execution");
    }

    public void assertPeutAffecterLots(DossierEtude dossier) {
        if (peutDeciderGo() || estChargeEtudeCourant(dossier)) {
            return;
        }
        throw new IllegalStateException("etudes.lot.affectation_reservee_charge");
    }

    public boolean estActeurCourant(String identifiant) {
        return estMemeActeur(identifiant);
    }

    private boolean estMemeActeur(String identifiant) {
        if (!StringUtils.hasText(identifiant)) {
            return false;
        }
        String cle = identifiant.trim();
        var userId = UserContext.getUserIdOrNull();
        if (userId != null && cle.equalsIgnoreCase(userId.toString())) {
            return true;
        }
        String email = UserContext.getUserEmail();
        return StringUtils.hasText(email) && cle.equalsIgnoreCase(email.trim());
    }
}
