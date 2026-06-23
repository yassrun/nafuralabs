package ma.nafura.achats.api.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ContratSousTraitanceDto {

    private String id;
    private String numero;
    private String sousTraitantId;
    private String sousTraitantNom;
    private String ice;
    private String chantierId;
    private String chantierCode;
    private String chantierNom;
    private String objet;
    private BigDecimal montantHt;
    private BigDecimal retenueGarantieTaux;
    private LocalDate dateSignature;
    private LocalDate dateDebut;
    private LocalDate dateFin;
    private BigDecimal avancementPercent;
    private String status;
    private Boolean declarationArt187;
}
