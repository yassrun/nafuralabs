package ma.nafura.achats.api.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import lombok.Data;

@Data
public class ReceptionAchatCreateDto {

    /** Magasin. Absent = livraison directe chantier, pas d'écriture stock. */
    private UUID destLocationId;

    private LocalDate dateReception;

    private String blNumero;

    private String notes;

    @NotEmpty
    @Valid
    private List<ReceptionAchatLigneInputDto> lignes;
}
