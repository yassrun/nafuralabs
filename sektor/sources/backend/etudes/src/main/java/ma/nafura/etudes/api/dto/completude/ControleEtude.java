package ma.nafura.etudes.api.dto.completude;

import java.util.Map;
import java.util.UUID;
import lombok.Builder;
import lombok.Value;

/** Un contrôle structuré lu par synthèse, bandeau et gates (SEKTOR-211 AC-1). */
@Value
@Builder
public class ControleEtude {

    String code;
    int phase;
    int etapeBackend;
    SeveriteControle severite;
    String messageKey;
    Map<String, Object> faits;
    ActionControle action;
    UUID noeudId;
    UUID articleId;
}
