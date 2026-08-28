package ma.nafura.marches.service.port;

import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnMissingBean(ChantierVentePort.class)
public class NoOpChantierVentePort implements ChantierVentePort {

    @Override
    public void basculerVersMarche(String chantierId) {
        // Module chantiers absent : pas de bascule de vente.
    }
}
