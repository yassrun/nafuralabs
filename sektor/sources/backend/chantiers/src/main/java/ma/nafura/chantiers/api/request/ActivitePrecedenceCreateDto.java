package ma.nafura.chantiers.api.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ActivitePrecedenceCreateDto {

    @NotBlank
    private String predActiviteId;

    @NotBlank
    private String succActiviteId;

    /** FD (défaut) | DD | FF | DF */
    private String typeLien;
}
