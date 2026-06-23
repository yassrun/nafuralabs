package ma.nafura.rh.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.Data;

@Data
public class HeureSupplementaireCreateDto {

    private String id;

    @NotBlank
    private String employeId;

    @NotNull
    private LocalDate date;

    @NotBlank
    private String type;

    @NotNull
    @Positive
    private BigDecimal heures;

    private String pointageId;

    private String status;
}
