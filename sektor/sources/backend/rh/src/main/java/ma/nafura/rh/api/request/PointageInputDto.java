package ma.nafura.rh.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.Data;

@Data
public class PointageInputDto {

    private String id;

    @NotBlank
    private String employeId;

    @NotNull
    private LocalDate date;

    @NotBlank
    private String mode;

    private String heureArrivee;
    private String heureDepart;
    private BigDecimal heuresNormales;
    private BigDecimal heuresSup;
    private String status;
    private String posteBudgetaireId;
}
