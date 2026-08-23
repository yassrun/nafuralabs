package ma.nafura.etudes.api.dto;

import java.util.UUID;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
/**
 * AC-10 — la conversion ne rend qu'un chantier. Aucun {@code marcheId} : le marché naît à la
 * notification, pas ici, et un chantier de régie ou sur bon de commande n'en aura jamais.
 */
public class DossierConversionResultDto {
    private UUID dossierId;
    private String chantierId;
    private String status;
}
