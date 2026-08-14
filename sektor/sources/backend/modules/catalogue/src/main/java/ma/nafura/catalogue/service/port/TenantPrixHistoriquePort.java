package ma.nafura.catalogue.service.port;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

/** Historique de prix tenant (L16b) — moyenne sur fenêtre récente. */
public interface TenantPrixHistoriquePort {

    /**
     * Moyenne des prix unitaires tenant pour un item sur les 6 derniers mois.
     * Empty si pas assez de données.
     */
    Optional<BigDecimal> moyenne6Mois(UUID itemId);
}
