package ma.nafura.achats.service.port;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Pont Achats → Chantiers. Réception BL : réel sur le nœud (ou frais de chantier si pas de nœud).
 * Module chantiers absent (tests achats isolés) : no-op.
 */
public interface ReceptionImputationChantierPort {

    void imputerReel(
            String chantierId,
            String noeudId,
            BigDecimal montantHt,
            LocalDate dateCout,
            String libelle,
            String source);
}
