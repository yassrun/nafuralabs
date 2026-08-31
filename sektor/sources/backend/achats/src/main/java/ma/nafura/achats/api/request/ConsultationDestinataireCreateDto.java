package ma.nafura.achats.api.request;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;
import lombok.Data;

@Data
public class ConsultationDestinataireCreateDto {

    @NotNull
    private UUID fournisseurId;

    /** Obligatoire seulement s’il y a N contacts e-mail (AC-6). */
    private UUID contactId;
}
