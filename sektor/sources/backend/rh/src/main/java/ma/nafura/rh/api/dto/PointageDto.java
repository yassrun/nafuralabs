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
public class PointageDto {

    private String id;
    private String date;
    private String chantierId;
    private String chantierCode;
    private String employeId;
    private String employeNom;
    private String mode;
    private String heureArrivee;
    private String heureDepart;
    private BigDecimal heuresNormales;
    private BigDecimal heuresSup;
    private String status;
    private String journeeBatchId;
    private String posteBudgetaireId;
}
