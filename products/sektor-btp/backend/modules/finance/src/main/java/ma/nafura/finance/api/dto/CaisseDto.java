package ma.nafura.finance.api.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CaisseDto {
    private UUID id;
    private String caisseType;
    private String code;
    private String name;
    private String chantierId;
    private String chantierLabel;
    private String chefChantierId;
    private String chefChantierName;
    private String currencyCode;
    private String glAccountCode;
    private BigDecimal soldeInitial;
    private BigDecimal soldeActuel;
    private String status;
    private LocalDate dateOuverture;
    private LocalDate dateCloture;
    private String notes;
}
