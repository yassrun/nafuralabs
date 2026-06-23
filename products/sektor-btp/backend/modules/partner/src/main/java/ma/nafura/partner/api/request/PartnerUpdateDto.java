package ma.nafura.partner.api.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class PartnerUpdateDto {

    @Size(max = 30)
    private String code;

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
}
