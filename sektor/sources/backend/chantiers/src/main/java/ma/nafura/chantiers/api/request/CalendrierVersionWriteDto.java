package ma.nafura.chantiers.api.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.time.LocalDate;
import java.util.List;
import lombok.Data;

@Data
public class CalendrierVersionWriteDto {

    /** Absente = aujourd'hui (création) ou version existante de même date d'effet (remplacement). */
    private LocalDate dateEffet;

    @NotBlank
    private String fuseauIana;

    @Valid
    @NotEmpty
    private List<CalendrierCreneauWriteDto> creneaux;

    @Valid
    private List<CalendrierExceptionWriteDto> exceptions;
}
