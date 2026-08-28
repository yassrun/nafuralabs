package ma.nafura.achats.service.port;

/**
 * Pont Achats → Chantiers. Un contrat ST palier 1 s'accroche à un poste vendu.
 * Module chantiers absent (tests achats isolés) : no-op.
 */
public interface NoeudChantierPort {

    void requirePosteVendu(String chantierId, String noeudId);
}
