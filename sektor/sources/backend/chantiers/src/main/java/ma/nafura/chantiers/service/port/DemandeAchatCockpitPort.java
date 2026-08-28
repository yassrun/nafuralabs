package ma.nafura.chantiers.service.port;

/**
 * SEKTOR-227 — lecture Achats pour le cockpit : compteur DA par chantier.
 * Implémenté côté Chantiers quand le BC Achats est présent ; NoOp sinon.
 */
public interface DemandeAchatCockpitPort {

    /** Nombre de demandes d'achat rattachées au chantier (tous statuts). */
    long compterParChantier(String chantierId);
}
