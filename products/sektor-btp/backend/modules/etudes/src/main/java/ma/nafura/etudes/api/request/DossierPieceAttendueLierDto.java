package ma.nafura.etudes.api.request;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;
import lombok.Data;

@Data
public class DossierPieceAttendueLierDto {

    @NotNull
    private UUID dossierDocumentId;
}
