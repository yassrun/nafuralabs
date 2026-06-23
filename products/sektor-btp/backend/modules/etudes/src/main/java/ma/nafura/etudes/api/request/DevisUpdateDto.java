package ma.nafura.etudes.api.request;

import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import lombok.Data;

@Data
public class DevisUpdateDto {

    private String clientId;

    private String clientName;

    private String contactClient;

    private String objet;

    private String ville;

    private LocalDate dateEmission;

    private LocalDate dateValidite;

    private String metreId;

    private String dpgfId;

    private String bibliothequeReference;

    private String conditionsPaiement;

    private Integer delaiExecutionJours;

    private BigDecimal tvaTaux;

    private BigDecimal remiseGlobalePercent;

    private String status;

    private String notes;

    @Valid
    private List<DevisLigneInputDto> lignes;
}
