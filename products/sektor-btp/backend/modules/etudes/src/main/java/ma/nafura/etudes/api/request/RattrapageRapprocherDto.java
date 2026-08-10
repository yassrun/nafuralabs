package ma.nafura.etudes.api.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.UUID;
import lombok.Data;

@Data
public class RattrapageRapprocherDto {
    @NotEmpty
    private List<UUID> composantIds;

    @NotNull
    private UUID itemId;
}
