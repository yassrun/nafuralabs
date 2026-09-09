package ma.nafura.chantiers.api.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.List;
import lombok.Data;

@Data
public class CalendrierExceptionWriteDto {

    @NotNull
    private LocalDate dateLocale;

    /** FERMETURE | OUVERTURE */
    @NotBlank
    private String type;

    @Valid
    private List<CalendrierCreneauWriteDto> creneaux;
}
