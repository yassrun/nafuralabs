package ma.nafura.hse.api.request;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import lombok.Data;

@Data
public class IncidentUpdateDto {

    private String chantierId;

    private String chantierCode;

    private String employeId;

    private String victimeNom;

    private LocalDate dateIncident;

    private LocalTime heureIncident;

    private String lieu;

    private String typeIncident;

    private String gravite;

    private String description;

    private String causes;

    private String actionsImmediates;

    private String planAction;

    private Integer joursArret;

    private String status;

    private String notes;

    private List<String> photosUrls;

    private List<String> temoins;

    private BigDecimal ijssMontant;

    private String ijssPeriode;
}
