package ma.nafura.hse.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import lombok.Data;

@Data
public class IncidentCreateDto {

    private String id;

    private String chantierId;

    private String chantierCode;

    private String employeId;

    private String victimeNom;

    @NotNull
    private LocalDate dateIncident;

    private LocalTime heureIncident;

    @NotBlank
    private String lieu;

    @NotBlank
    private String typeIncident;

    @NotBlank
    private String gravite;

    @NotBlank
    private String description;

    private String causes;

    private String actionsImmediates;

    private String planAction;

    private Integer joursArret;

    private String status;

    private String notes;

    private List<String> photosUrls = new ArrayList<>();

    private List<String> temoins = new ArrayList<>();

    private BigDecimal ijssMontant;

    private String ijssPeriode;
}
