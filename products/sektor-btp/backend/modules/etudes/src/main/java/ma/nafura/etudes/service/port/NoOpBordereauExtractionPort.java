package ma.nafura.etudes.service.port;

import org.springframework.stereotype.Component;

@Component
public class NoOpBordereauExtractionPort implements BordereauExtractionPort {

    @Override
    public boolean isAvailable() {
        return false;
    }
}
