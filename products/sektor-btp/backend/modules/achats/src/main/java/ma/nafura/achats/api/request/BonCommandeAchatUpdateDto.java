package ma.nafura.achats.api.request;

import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import lombok.Data;

@Data
public class BonCommandeAchatUpdateDto {

    private String fournisseurId;

    private String fournisseurName;

    private String chantierId;

    private String chantierCode;

    private String chantierName;

    private String daId;

    private String daNumero;

    private String aoId;

    private String aoNumero;

    private String contratId;

    private String contratNumero;

    private String rubrique;

    private LocalDate dateCreation;

    private LocalDate dateLivraisonPrevue;

    private String conditionsPaiement;

    private String modeReglement;

    private BigDecimal tvaTaux;

    private String status;

    private String validateurId;

    private String validateurName;

    private LocalDate validationDate;

    private String notes;

    @Valid
    private List<BonCommandeAchatLigneInputDto> lignes;
}
