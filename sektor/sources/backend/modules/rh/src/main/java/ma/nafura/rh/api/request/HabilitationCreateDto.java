package ma.nafura.rh.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import lombok.Data;

@Data
public class HabilitationCreateDto {

    private String id;

    @NotBlank
    private String employeId;

    @NotBlank
    private String code;

    @NotBlank
    private String libelle;

    @NotNull
    private LocalDate dateObtention;

    private LocalDate dateExpiration;
}
