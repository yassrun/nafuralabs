package ma.nafura.chantiers.port;

import ma.nafura.chantiers.api.dto.SituationFactureSummaryDto;
import ma.nafura.chantiers.api.dto.SituationTravauxDto;

/**
 * SPI for creating a client invoice from a validated situation without reversing the
 * chantiers → ventes dependency direction.
 */
public interface SituationToFacturePort {

    SituationFactureSummaryDto createFactureFromSituation(SituationTravauxDto situation);
}
