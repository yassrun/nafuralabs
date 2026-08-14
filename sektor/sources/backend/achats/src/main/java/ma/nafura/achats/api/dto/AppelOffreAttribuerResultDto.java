package ma.nafura.achats.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import ma.nafura.achats.domain.model.AppelOffreAchat;
import ma.nafura.achats.domain.model.BonCommandeAchat;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppelOffreAttribuerResultDto {

    private AppelOffreAchat ao;

    private BonCommandeAchat bc;
}
