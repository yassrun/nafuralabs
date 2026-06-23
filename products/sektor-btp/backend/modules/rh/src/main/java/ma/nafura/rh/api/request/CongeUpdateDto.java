package ma.nafura.rh.api.request;

import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.Data;

@Data
public class CongeUpdateDto {

    private String employeId;

    private String employeNom;

    private String type;

    private LocalDate dateDebut;

    private LocalDate dateFin;

    private BigDecimal nombreJours;

    private String status;

    private String motif;

    private String motifRefus;

    private String notes;
}
