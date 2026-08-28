package ma.nafura.marches.service.port;

/**
 * Pont Marchés → Chantiers. À la notification, la vente active bascule devis → marché.
 * Module chantiers absent (tests marchés isolés) : no-op.
 */
public interface ChantierVentePort {

    void basculerVersMarche(String chantierId);
}
