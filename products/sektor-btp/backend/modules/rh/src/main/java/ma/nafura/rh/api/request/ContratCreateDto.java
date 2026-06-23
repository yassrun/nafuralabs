package ma.nafura.rh.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.Data;

@Data
public class ContratCreateDto {

    private String id;

    @NotBlank
    private String employeId;

    @NotBlank
    private String typeContrat;

    @NotNull
    private LocalDate dateDebut;

    private LocalDate dateFin;

    @NotNull
    private BigDecimal salaireBase;

    private String status;
}
