package ma.nafura.partner.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;
import lombok.Data;

@Data
public class PartnerContactCreateDto {

    @NotNull
    private UUID partnerId;

    @NotBlank
    @Size(max = 255)
    private String nom;

    @Size(max = 100)
    private String fonction;

    @Size(max = 255)
    private String email;

    @Size(max = 50)
    private String telephone;

    private Boolean isPrimary;
}
