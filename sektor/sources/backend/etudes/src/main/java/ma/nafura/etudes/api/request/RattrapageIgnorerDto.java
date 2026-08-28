package ma.nafura.etudes.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import java.util.UUID;
import lombok.Data;

@Data
public class RattrapageIgnorerDto {
    @NotEmpty
    private List<UUID> composantIds;

    /** Motif obligatoire (SEKTOR-215 AC-10). */
    @NotBlank
    private String motif;
}
