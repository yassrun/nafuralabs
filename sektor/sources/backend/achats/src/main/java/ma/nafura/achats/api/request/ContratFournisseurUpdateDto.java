package ma.nafura.achats.api.request;

import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.Data;

@Data
public class ContratFournisseurUpdateDto {

    private String type;

    private String fournisseurId;

    private String chantierId;

    private LocalDate dateDebut;

    private LocalDate dateFin;

    private String status;

    private BigDecimal montantHt;

    private Boolean art187Declare;

    private Boolean art187ValideMoa;

    private BigDecimal retenueGarantieTaux;

    private Boolean paiementDirectMoa;

    private String notes;
}
