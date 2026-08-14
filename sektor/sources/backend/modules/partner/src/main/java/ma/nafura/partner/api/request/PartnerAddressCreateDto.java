package ma.nafura.partner.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;
import lombok.Data;

@Data
public class PartnerAddressCreateDto {

    @NotNull
    private UUID partnerId;

    @NotBlank
    @Size(max = 30)
    private String type;

    @Size(max = 255)
    private String ligne1;

    @Size(max = 255)
    private String ligne2;

    @Size(max = 100)
    private String ville;

    @Size(max = 20)
    private String codePostal;

    @Size(max = 2)
    private String pays;

    private Boolean isDefault;
}
