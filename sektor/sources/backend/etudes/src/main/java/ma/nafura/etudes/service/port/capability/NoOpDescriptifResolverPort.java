package ma.nafura.etudes.service.port.capability;

import org.springframework.stereotype.Component;

@Component
public class NoOpDescriptifResolverPort implements DescriptifResolverPort {

    @Override
    public boolean isAvailable() {
        return false;
    }

    @Override
    public String resolveDescriptif(ma.nafura.etudes.domain.dpgf.DpgfNoeud article) {
        return null;
    }
}
