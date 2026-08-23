package ma.nafura.achats.api.request;

import jakarta.validation.constraints.NotNull;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.Data;

@Data
public class ConsultationAchatCreateDto {

    @NotNull
    private UUID fournisseurId;

    private List<String> clesStables = new ArrayList<>();

    /** Optionnel — null = hors étude. */
    private UUID dossierEtudeId;
}
