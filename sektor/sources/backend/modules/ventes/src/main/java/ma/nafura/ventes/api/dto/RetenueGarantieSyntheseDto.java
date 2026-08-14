package ma.nafura.ventes.api.dto;

import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RetenueGarantieSyntheseDto {

    private String clientId;
    private long nombreRetenues;
    private BigDecimal totalCumul;
    private BigDecimal totalRestitue;
    private BigDecimal totalReste;
    private long immobilisees;
    private long demandeRestitution;
}
