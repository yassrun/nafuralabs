package ma.nafura.chantiers.api.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BudgetLigneDto {

    private String id;

    private String rubrique;

    private String label;

    private String lot;

    @JsonProperty("initialHt")
    private BigDecimal previsionnelHt;

    @JsonProperty("reviseHt")
    private BigDecimal reviseHt;

    private BigDecimal engageHt;

    private BigDecimal realiseHt;

    private BigDecimal resteHt;

    private BigDecimal ecartHt;

    private BigDecimal ecartPercent;

    @JsonProperty("posteBudgetaireId")
    private String posteBudgetaireId;

    private int ordre;
}
