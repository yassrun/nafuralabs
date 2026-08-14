package ma.nafura.chantiers.api.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BudgetChantierDto {

    private String id;

    @JsonProperty("chantierId")
    private String chantierId;

    private String code;

    private String name;

    private String client;

    @JsonProperty("budgetInitialHt")
    private BigDecimal previsionnelHt;

    @JsonProperty("budgetReviseHt")
    private BigDecimal reviseHt;

    private BigDecimal engageHt;

    private BigDecimal realiseHt;

    @JsonProperty("resteAEngagerHt")
    private BigDecimal resteAEngagerHt;

    private List<BudgetLigneDto> lignes;
}
