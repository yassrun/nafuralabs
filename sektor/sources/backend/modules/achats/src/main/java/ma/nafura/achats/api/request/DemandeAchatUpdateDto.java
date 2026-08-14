package ma.nafura.achats.api.request;

import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import lombok.Data;

@Data
public class DemandeAchatUpdateDto {

    private String chantierId;

    private String chantierCode;

    private String chantierName;

    private LocalDate dateBesoin;

    private String demandeurId;

    private String demandeurName;

    private String motif;

    private String status;

    private String approbateurId;

    private String approbateurName;

    private LocalDate approbationDate;

    private String motifRejet;

    private String bcId;

    private String bcNumero;

    private String notes;

    @Valid
    private List<DemandeAchatLigneInputDto> lignes;
}
