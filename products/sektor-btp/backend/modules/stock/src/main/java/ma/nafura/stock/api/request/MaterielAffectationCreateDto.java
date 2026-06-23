package ma.nafura.stock.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.UUID;
import lombok.Data;

@Data
public class MaterielAffectationCreateDto {

    @NotNull
    private UUID materielId;

    private UUID locationId;

    @Size(max = 200)
    private String locationName;

    @NotBlank
    @Size(max = 100)
    private String chantierRef;

    @NotNull
    private LocalDate dateDebut;

    private LocalDate dateFin;

    private String notes;
}
