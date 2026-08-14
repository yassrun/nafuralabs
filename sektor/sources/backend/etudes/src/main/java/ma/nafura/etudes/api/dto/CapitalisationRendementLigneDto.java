package ma.nafura.etudes.api.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CapitalisationRendementLigneDto {
    private String libelle;
    private String unite;
    private BigDecimal rendementBiblio;
    private BigDecimal rendementEtude;
}
