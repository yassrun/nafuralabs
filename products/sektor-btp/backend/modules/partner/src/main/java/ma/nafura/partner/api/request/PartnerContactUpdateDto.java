package ma.nafura.partner.api.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class PartnerContactUpdateDto {

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
