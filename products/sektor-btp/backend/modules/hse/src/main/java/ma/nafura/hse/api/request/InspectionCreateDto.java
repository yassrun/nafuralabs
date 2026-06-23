package ma.nafura.hse.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.Data;

@Data
public class InspectionCreateDto {

    private String id;

    @NotNull
    private LocalDate dateInspection;

    private String chantierId;

    private String chantierCode;

    @NotBlank
    private String inspecteurNom;

    private String organismeType;

    private String referenceRapport;

    @NotBlank
    private String thematique;

    private Integer nbObservations;

    private Integer nbNonConformites;

    private BigDecimal noteGlobale;

    private String status;

    private String observations;

    private String notes;
}
