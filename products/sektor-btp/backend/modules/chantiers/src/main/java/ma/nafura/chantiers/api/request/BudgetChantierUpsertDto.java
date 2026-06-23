package ma.nafura.chantiers.api.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;
import lombok.Data;

@Data
public class BudgetChantierUpsertDto {

    private BigDecimal previsionnelHt;

    private BigDecimal reviseHt;

    @Valid
    @NotNull
    private List<BudgetLigneInputDto> lignes;

    @Data
    public static class BudgetLigneInputDto {

        private String id;

        @NotBlank
        private String rubrique;

        @NotBlank
        private String label;

        private String lot;

        @NotNull
        private BigDecimal previsionnelHt;

        @NotNull
        private BigDecimal reviseHt;

        private BigDecimal engageHt;

        private BigDecimal realiseHt;

        private String posteBudgetaireId;

        private Integer ordre;
    }
}
