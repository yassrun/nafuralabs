package ma.nafura.marches.service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FormuleRevisionK {

    private BigDecimal termeFixe;
    @Builder.Default
    private List<TermeVariable> termesVariables = new ArrayList<>();

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TermeVariable {
        private BigDecimal coefficient;
        private String indiceCode;
        private BigDecimal indiceBaseValeur;
    }
}
