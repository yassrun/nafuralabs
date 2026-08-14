package ma.nafura.rh.api.request;

import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.Data;

@Data
public class ContratUpdateDto {

    private String employeId;

    private String typeContrat;

    private LocalDate dateDebut;

    private LocalDate dateFin;

    private BigDecimal salaireBase;

    private String status;
}
