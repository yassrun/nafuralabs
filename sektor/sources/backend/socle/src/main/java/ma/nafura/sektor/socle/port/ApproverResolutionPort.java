package ma.nafura.sektor.socle.port;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

/** Port socle : résoudre un approbateur. L'impl vit dans chantiers. */
public interface ApproverResolutionPort {

    Optional<Resolved> resolve(String roleRef, String chantierId, LocalDate onDate);

    String normalizeRole(String roleRef);

    String labelRole(String roleRef);

    record Resolved(String roleCode, String displayName, UUID userId) {}
}
