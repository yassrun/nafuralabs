package ma.nafura.sektor.socle.port.bc;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/** Alertes chrome — formations HSE dont l’attestation expire. Impl dans hse. */
public interface ErpChromeHsePort {

    List<ExpiringFormation> expiringFormations(UUID tenantId, LocalDate from, LocalDate to);

    record ExpiringFormation(String id, String titre, String formateur, LocalDate expiryDate) {}
}
