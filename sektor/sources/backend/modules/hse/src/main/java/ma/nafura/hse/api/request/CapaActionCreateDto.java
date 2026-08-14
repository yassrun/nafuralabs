package ma.nafura.hse.api.request;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;
import lombok.Data;

@Data
public class CapaActionCreateDto {

    @NotBlank
    private String typeCapa;

    @NotBlank
    private String description;

    private String responsableId;

    private String responsableNom;

    private LocalDate dateEcheance;
}
