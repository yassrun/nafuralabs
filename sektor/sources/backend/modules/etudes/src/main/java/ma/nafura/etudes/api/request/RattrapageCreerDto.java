package ma.nafura.etudes.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import java.util.UUID;
import lombok.Data;

@Data
public class RattrapageCreerDto {
    @NotEmpty
    private List<UUID> composantIds;

    @NotBlank
    private String libelle;

    @NotBlank
    private String nature;

    private String uomCode;
}
