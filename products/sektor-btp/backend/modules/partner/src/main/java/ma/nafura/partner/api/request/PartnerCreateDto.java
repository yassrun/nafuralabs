package ma.nafura.partner.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;
import lombok.Data;
import ma.nafura.partner.domain.model.PartnerRoleType;

@Data
public class PartnerCreateDto {

    @NotBlank
    @Size(max = 30)
    private String code;

    @NotBlank
    @Size(max = 255)
    private String raisonSociale;

    @Size(max = 50)
    private String formeJuridique;

    @Size(max = 15)
    private String ice;

    @Size(max = 8)
    private String identifiantFiscal;

    @Size(max = 50)
    private String registreCommerce;

    @Size(max = 50)
    private String patente;

    @Size(max = 20)
    private String cnss;

    @Size(max = 20)
    private String amo;

    @Size(max = 255)
    private String email;

    @Size(max = 50)
    private String phone;

    @Size(max = 255)
    private String website;

    private List<PartnerRoleType> roles;
}
