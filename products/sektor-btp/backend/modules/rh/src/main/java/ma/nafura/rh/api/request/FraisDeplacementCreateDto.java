package ma.nafura.rh.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.Data;

@Data
public class FraisDeplacementCreateDto {

    private String id;

    @NotBlank
    private String employeId;

    private String employeNom;

    @NotBlank
    private String type;

    @NotNull
    private LocalDate date;

    @NotNull
    private BigDecimal montant;

    private BigDecimal km;

    private String status;
}
