package ma.nafura.rh.api.dto;

import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlanningEntryDto {

    private String employeId;
    private String employeNom;
    private String dateJour;
    private String chantierId;
    private String chantierCode;
    private BigDecimal pointageHeures;
    private String congeType;
    private String mode;
}
