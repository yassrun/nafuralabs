package ma.nafura.chantiers.api.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SituationConvertToFactureDto {

    private SituationTravauxDto situation;
    private String factureId;
    private SituationFactureSummaryDto facture;
}
