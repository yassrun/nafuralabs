package ma.nafura.achats.api.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import ma.nafura.achats.domain.fournisseur.PartnerRoleType;

@Data
public class PartnerRoleAssignDto {

    @NotNull
    private PartnerRoleType role;
}
