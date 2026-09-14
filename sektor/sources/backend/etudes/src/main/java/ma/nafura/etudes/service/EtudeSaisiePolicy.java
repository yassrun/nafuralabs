package ma.nafura.etudes.service;

import ma.nafura.etudes.domain.dossier.DossierEtude;
import org.springframework.stereotype.Component;

/**
 * Façade de saisie / affectation — délègue au {@link DossierEtudeWorkflowPolicy}.
 */
@Component
public class EtudeSaisiePolicy {

    private final DossierEtudeWorkflowPolicy workflow = new DossierEtudeWorkflowPolicy();

    public boolean peutDeciderGo() {
        return workflow.peutDeciderGo();
    }

    public void assertPeutSaisirApresGo(DossierEtude dossier) {
        workflow.assertPeutSaisirApresGo(dossier);
    }

    public boolean estChargeEtudeCourant(DossierEtude dossier) {
        return workflow.estChargeEtudeCourant(dossier);
    }

    public boolean estResponsableExecutionCourant(DossierEtude dossier) {
        return workflow.estResponsableExecutionCourant(dossier);
    }

    public void assertPeutAvisExecution(DossierEtude dossier) {
        workflow.assertPeutAvisExecution(dossier);
    }

    public void assertPeutAffecterLots(DossierEtude dossier) {
        workflow.assertPeutAffecterLots(dossier);
    }

    public boolean estActeurCourant(String identifiant) {
        return workflow.estActeurCourant(identifiant);
    }
}
