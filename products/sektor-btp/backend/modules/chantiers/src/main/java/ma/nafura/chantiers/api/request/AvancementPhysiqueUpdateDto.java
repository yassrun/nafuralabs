package ma.nafura.chantiers.api.request;

import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.Data;

@Data
public class AvancementPhysiqueUpdateDto {

    private LocalDate date;

    private BigDecimal quantiteRealisee;

    private String notes;

    private String status;
}
