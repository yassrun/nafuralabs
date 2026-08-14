package ma.nafura.achats.api.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import lombok.Data;

@Data
public class BonCommandeAchatCreateDto {

    @NotBlank
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

    @NotNull
    private LocalDate dateLivraisonPrevue;

    @NotBlank
    private String conditionsPaiement;

    private String modeReglement;

    private BigDecimal tvaTaux;

    private String status;

    private String validateurId;

    private String validateurName;

    private LocalDate validationDate;

    private String notes;

    @Valid
    private List<BonCommandeAchatLigneInputDto> lignes = new ArrayList<>();
}
