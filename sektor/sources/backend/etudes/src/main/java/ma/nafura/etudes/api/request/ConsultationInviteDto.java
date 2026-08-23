package ma.nafura.etudes.api.request;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;
import lombok.Data;

@Data
public class ConsultationInviteDto {

    @NotNull
    private UUID partenaireId;
}
