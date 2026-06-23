package ma.nafura.partner.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;
import lombok.Data;

@Data
public class PartnerBankAccountCreateDto {

    @NotNull
    private UUID partnerId;

    @Size(max = 100)
    private String banque;

    @NotBlank
    @Size(max = 24)
    private String rib;

    private Boolean isDefault;
}
