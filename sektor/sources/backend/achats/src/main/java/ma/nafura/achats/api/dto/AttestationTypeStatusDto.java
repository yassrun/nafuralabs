package ma.nafura.achats.api.dto;

import java.time.LocalDate;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttestationTypeStatusDto {

    private String type;
    private String status;
    private UUID attestationId;
    private LocalDate dateExpiration;
    private boolean present;
}
