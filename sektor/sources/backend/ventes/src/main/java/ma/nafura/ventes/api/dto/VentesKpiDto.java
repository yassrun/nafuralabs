package ma.nafura.ventes.api.dto;

import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VentesKpiDto {

    private BigDecimal caCumule;
    private BigDecimal caEncaisse;
    private BigDecimal creancesOuvertes;
    private int facturesEnRetard;
    private int nbDevisGagnes;
}
