package ma.nafura.chantiers.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import lombok.Data;

@Data
public class ActiviteChantierCreateDto {

    @NotBlank
    private String libelle;

    @NotNull
    private LocalDate dateDebut;

    @NotNull
    private LocalDate dateFin;

    private String parentActiviteId;

    private String zoneId;

    private Integer ordre;

    private String status;
}
