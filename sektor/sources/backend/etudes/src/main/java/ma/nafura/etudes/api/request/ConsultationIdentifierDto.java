package ma.nafura.etudes.api.request;

import java.util.ArrayList;
import java.util.List;
import lombok.Data;

@Data
public class ConsultationIdentifierDto {

    /** Identités cochées. Absentes des lignes de devis → ignorées (fichier seul n'identifie pas). */
    private List<String> cleStables = new ArrayList<>();
}
