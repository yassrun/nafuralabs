package ma.nafura.achats.api.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.Data;

@Data
public class OffreFournisseurInputDto {

    private UUID id;

    @NotBlank
    private String fournisseurId;

    private String fournisseurName;

    private LocalDate dateReponse;

    private BigDecimal totalHt;

    private Integer delaiLivraisonJours;

    private String conditionsPaiement;

    private String notes;

    private Boolean retenue;

    private BigDecimal score;

    @Valid
    private List<OffreFournisseurLigneInputDto> lignes = new ArrayList<>();
}
