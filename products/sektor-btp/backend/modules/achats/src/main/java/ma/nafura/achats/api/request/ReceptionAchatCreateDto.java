package ma.nafura.achats.api.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import lombok.Data;

@Data
public class ReceptionAchatCreateDto {

    @NotNull
    private UUID destLocationId;

    private LocalDate dateReception;

    private String blNumero;

    private String notes;

    @NotEmpty
    @Valid
    private List<ReceptionAchatLigneInputDto> lignes;
}
