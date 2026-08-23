package ma.nafura.achats.service.port;

import java.util.UUID;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnMissingBean(ConsultationLienEtudePort.class)
public class NoOpConsultationLienEtudePort implements ConsultationLienEtudePort {

    @Override
    public void appliquerFlagsApresDevis(UUID dossierEtudeId) {
        // Module études absent (tests achats isolés) : pas d'arbre, pas de flag.
    }
}
