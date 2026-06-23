package ma.nafura.etudes.api.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import lombok.Data;

@Data
public class DevisCreateDto {

    @NotBlank
    private String clientId;

    private String clientName;

    private String contactClient;

    @NotBlank
    private String objet;

    private String ville;

    @NotNull
    private LocalDate dateEmission;

    @NotNull
    private LocalDate dateValidite;

    private String metreId;

    private String dpgfId;

    private String bibliothequeReference;

    @NotBlank
    private String conditionsPaiement;

    private Integer delaiExecutionJours;

    private BigDecimal tvaTaux;

    private BigDecimal remiseGlobalePercent;

    private String status;

    private String notes;

    @Valid
    private List<DevisLigneInputDto> lignes = new ArrayList<>();
}
