package ma.nafura.chantiers.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import lombok.Data;

@Data
public class ChantierAffectationCreateDto {

    @NotBlank
    private String employeId;

    @NotBlank
    private String roleCode;

    @NotNull
    private LocalDate dateDebut;

    private LocalDate dateFin;
}
