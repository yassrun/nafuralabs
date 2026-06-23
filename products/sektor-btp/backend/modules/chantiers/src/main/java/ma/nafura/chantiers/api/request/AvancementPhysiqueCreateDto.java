package ma.nafura.chantiers.api.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.List;
import lombok.Data;

@Data
public class AvancementPhysiqueCreateDto {

    @NotNull
    private LocalDate date;

    @NotBlank
    private String status;

    @NotBlank
    private String saisieParId;

    private String saisieParName;

    @NotEmpty
    @Valid
    private List<AvancementPhysiqueEntryDto> entries;
}
