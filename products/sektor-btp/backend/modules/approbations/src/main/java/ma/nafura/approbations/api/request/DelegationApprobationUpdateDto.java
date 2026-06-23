package ma.nafura.approbations.api.request;

import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DelegationApprobationUpdateDto {

    private String delegueUserId;
    private LocalDate dateDebut;
    private LocalDate dateFin;
    private Boolean isActive;
}
