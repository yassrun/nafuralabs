package ma.nafura.achats.api.request;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.Data;

@Data
public class ConsultationAchatCreateDto {

    /**
     * Ignoré (AC-3). Conservé pour overlay 139 / vieux clients : ne crée pas de destinataire.
     */
    private UUID fournisseurId;

    private List<String> clesStables = new ArrayList<>();

    /** Optionnel — null = hors étude. */
    private UUID dossierEtudeId;
}
