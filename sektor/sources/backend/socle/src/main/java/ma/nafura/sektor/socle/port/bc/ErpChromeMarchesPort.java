package ma.nafura.sektor.socle.port.bc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/** Alertes chrome — factures en retard et cautions expirant. Impl dans marches. */
public interface ErpChromeMarchesPort {

    List<OverdueInvoice> overdueInvoices(UUID tenantId, LocalDate today);

    List<ExpiringCaution> expiringCautions(UUID tenantId, LocalDate today, int days);

    record OverdueInvoice(
            String id,
            String numero,
            String clientNom,
            BigDecimal netAPayer,
            LocalDate dateEcheance) {}

    record ExpiringCaution(
            String id,
            String numero,
            String banqueNom,
            BigDecimal montant,
            LocalDate dateExpiration,
            String contratMarcheId) {}
}
