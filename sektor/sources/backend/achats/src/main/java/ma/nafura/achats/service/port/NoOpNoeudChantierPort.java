package ma.nafura.achats.service.port;

import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnMissingBean(NoeudChantierPort.class)
public class NoOpNoeudChantierPort implements NoeudChantierPort {

    @Override
    public void requirePosteVendu(String chantierId, String noeudId) {
        // Module chantiers absent : pas d'arbre, pas de nature VENDU/INTERNE.
    }
}
