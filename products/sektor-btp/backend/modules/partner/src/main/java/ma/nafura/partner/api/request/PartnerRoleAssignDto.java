package ma.nafura.partner.api.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import ma.nafura.partner.domain.model.PartnerRoleType;

@Data
public class PartnerRoleAssignDto {

    @NotNull
    private PartnerRoleType role;
}
