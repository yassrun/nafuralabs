package ma.nafura.achats.api.dto;

import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MatchingLigneDto {

    private String articleId;
    private BigDecimal qteCommandee;
    private BigDecimal qteRecue;
    private BigDecimal qteFacturee;
    private BigDecimal pxUnitaireBC;
    private BigDecimal pxUnitaireFacture;
    private BigDecimal ecartQte;
    private BigDecimal ecartPx;
    private boolean bloquant;
}
