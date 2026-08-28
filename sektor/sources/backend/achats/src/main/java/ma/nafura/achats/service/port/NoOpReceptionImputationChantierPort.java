package ma.nafura.achats.service.port;

import java.math.BigDecimal;
import java.time.LocalDate;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnMissingBean(ReceptionImputationChantierPort.class)
public class NoOpReceptionImputationChantierPort implements ReceptionImputationChantierPort {

    @Override
    public void imputerReel(
            String chantierId,
            String noeudId,
            BigDecimal montantHt,
            LocalDate dateCout,
            String libelle,
            String source) {
        // Module chantiers absent : pas d'arbre, pas d'imputation.
    }
}
