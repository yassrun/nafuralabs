package ma.nafura.stock.api.request;

import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.UUID;
import lombok.Data;

@Data
public class MaterielAffectationUpdateDto {

    private UUID locationId;

    @Size(max = 200)
    private String locationName;

    @Size(max = 100)
    private String chantierRef;

    private LocalDate dateDebut;

    private LocalDate dateFin;

    private String notes;
}
