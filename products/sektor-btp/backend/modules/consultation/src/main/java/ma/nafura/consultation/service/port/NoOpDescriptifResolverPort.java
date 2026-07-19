package ma.nafura.consultation.service.port;

import ma.nafura.consultation.domain.model.ConsultationNoeud;
import org.springframework.stereotype.Component;

/** Default: no automatic descriptif; the expert fills it in. A RAG-based
 * adapter should be declared {@code @Primary} to override this. */
@Component
public class NoOpDescriptifResolverPort implements DescriptifResolverPort {

    @Override
    public boolean isAvailable() {
        return false;
    }

    @Override
    public String resolveDescriptif(ConsultationNoeud poste) {
        return null;
    }
}
