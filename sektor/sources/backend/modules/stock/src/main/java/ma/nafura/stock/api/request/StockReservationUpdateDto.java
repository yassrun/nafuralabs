package ma.nafura.stock.api.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.Data;

@Data
public class StockReservationUpdateDto {

    @Min(0)
    private BigDecimal quantity;

    @Size(max = 20)
    private String uom;

    private LocalDate dateBesoin;

    private LocalDate dateExpiration;

    @Size(max = 2000)
    private String motif;
}
