package ma.nafura.partner.api.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class PartnerBankAccountUpdateDto {

    @Size(max = 100)
    private String banque;

    @Size(max = 24)
    private String rib;

    private Boolean isDefault;
}
