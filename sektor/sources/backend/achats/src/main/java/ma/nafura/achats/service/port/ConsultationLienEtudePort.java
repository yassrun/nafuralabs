package ma.nafura.achats.service.port;

import java.util.UUID;

/**
 * Pont Achats → Études. Hors étude : no-op. Liée : flag CONSULTÉ si N devis extraits
 * couvrent un article du panier.
 */
public interface ConsultationLienEtudePort {

    void appliquerFlagsApresDevis(UUID dossierEtudeId);
}
