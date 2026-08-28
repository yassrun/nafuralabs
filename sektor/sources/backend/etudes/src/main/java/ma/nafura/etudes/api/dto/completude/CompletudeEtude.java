package ma.nafura.etudes.api.dto.completude;

import java.util.List;
import java.util.UUID;
import lombok.Builder;
import lombok.Value;

/** Read model unique de complétude (SEKTOR-211 — minimum AC-1 à AC-4). */
@Value
@Builder
public class CompletudeEtude {

    UUID dossierId;
    int phaseUi;
    int etapeBackend;
    boolean lectureSeule;
    CompletudeCompteursDto compteurs;
    List<ControleEtude> controles;
    QualiteChiffrageDto qualiteChiffrage;
}
