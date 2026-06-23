package ma.nafura.hse.api.request;

import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.Data;

@Data
public class InspectionUpdateDto {

    private LocalDate dateInspection;

    private String chantierId;

    private String chantierCode;

    private String inspecteurNom;

    private String organismeType;

    private String referenceRapport;

    private String thematique;

    private Integer nbObservations;

    private Integer nbNonConformites;

    private BigDecimal noteGlobale;

    private String status;

    private String observations;

    private String notes;
}
