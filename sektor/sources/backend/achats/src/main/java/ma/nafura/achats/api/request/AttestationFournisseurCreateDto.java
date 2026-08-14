package ma.nafura.achats.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import lombok.Data;

@Data
public class AttestationFournisseurCreateDto {

    @NotBlank
    private String partnerId;

    @NotBlank
    private String type;

    @NotNull
    private LocalDate dateEmission;

    @NotNull
    private LocalDate dateExpiration;

    private String scanUrl;
}
