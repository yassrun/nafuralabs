package ma.nafura.chantiers.api.dto;

import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChantierLotTreePosteDto {

    private String id;
    private String lotId;
    private String code;
    private String designation;
    private String unite;
    private BigDecimal quantite;
    private BigDecimal prixUnitaireHt;
    private BigDecimal montantHt;
    private int ordre;
}
