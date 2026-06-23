package ma.nafura.marches.api.request;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;
import lombok.Data;

@Data
public class ReserveReceptionCreateDto {

    private String id;

    @NotBlank
    private String libelle;

    private LocalDate dateLimiteLevee;
}
