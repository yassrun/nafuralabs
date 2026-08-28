package ma.nafura.etudes.api.request;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import java.util.UUID;
import lombok.Data;

@Data
public class RattrapagePosteSeulementDto {
    @NotEmpty
    private List<UUID> composantIds;
}
