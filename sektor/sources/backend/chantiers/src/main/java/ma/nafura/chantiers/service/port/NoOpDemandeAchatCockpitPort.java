package ma.nafura.chantiers.service.port;

import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.stereotype.Component;

/** SEKTOR-227 — Achats absent : la lecture échoue, le cockpit dégrade (pas de faux zéro). */
@Component
@ConditionalOnMissingBean(DemandeAchatCockpitPort.class)
public class NoOpDemandeAchatCockpitPort implements DemandeAchatCockpitPort {

    @Override
    public long compterParChantier(String chantierId) {
        throw new IllegalStateException("achats.cockpit.demandes_indisponibles");
    }
}
