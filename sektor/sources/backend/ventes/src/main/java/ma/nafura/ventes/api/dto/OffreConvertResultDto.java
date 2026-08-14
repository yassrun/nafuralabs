package ma.nafura.ventes.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import ma.nafura.ventes.domain.model.BonCommandeClient;
import ma.nafura.ventes.domain.model.Offre;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OffreConvertResultDto {

    private Offre offre;

    private BonCommandeClient bcc;
}
