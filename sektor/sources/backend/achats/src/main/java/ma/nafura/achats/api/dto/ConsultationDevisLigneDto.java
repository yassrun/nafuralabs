package ma.nafura.achats.api.dto;

import java.math.BigDecimal;
import java.util.UUID;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ConsultationDevisLigneDto {

    private UUID id;
    private String identite;
    private String libelle;
    private BigDecimal quantite;
    private String unite;
    private BigDecimal prixUnitaire;
}
