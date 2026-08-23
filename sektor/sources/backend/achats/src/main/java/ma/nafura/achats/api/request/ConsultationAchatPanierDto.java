package ma.nafura.achats.api.request;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.Data;

@Data
public class ConsultationAchatPanierDto {

    private List<String> clesStables = new ArrayList<>();

    /** Si la consultation est hors étude, lie le dossier courant. */
    private UUID dossierEtudeId;
}
