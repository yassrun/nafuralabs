package ma.nafura.chantiers.service;

import ma.nafura.marches.service.port.ChantierVentePort;
import org.springframework.stereotype.Component;

/** SEKTOR-225 — AC-12 : notification du marché bascule la vente active du chantier. */
@Component
public class ChantierVenteAdapter implements ChantierVentePort {

    private final ChantierService chantierService;

    public ChantierVenteAdapter(ChantierService chantierService) {
        this.chantierService = chantierService;
    }

    @Override
    public void basculerVersMarche(String chantierId) {
        chantierService.basculerVenteVersMarche(chantierId);
    }
}
