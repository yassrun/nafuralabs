package ma.nafura.rh.api.request;

import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.Data;

@Data
public class FraisDeplacementUpdateDto {

    private String employeId;

    private String employeNom;

    private String type;

    private LocalDate date;

    private BigDecimal montant;

    private BigDecimal km;

    private String status;
}
