package ma.nafura.achats.api.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PartnerAttestationsStatusDto {

    private String partnerId;
    private List<AttestationTypeStatusDto> chips;
    private boolean reglementBloque;
}
