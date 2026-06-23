package ma.nafura.rh.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import lombok.Data;

@Data
public class FormationCreateDto {

    private String id;

    @NotBlank
    private String employeId;

    @NotBlank
    private String libelle;

    @NotNull
    private LocalDate date;

    private String organisme;
}
