package ma.nafura.stock.api.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import lombok.Data;

@Data
public class StockReservationCreateDto {

    @NotNull
    private UUID itemId;

    @NotNull
    @Min(0)
    private BigDecimal quantity;

    @Size(max = 20)
    private String uom;

    @NotBlank
    @Size(max = 50)
    private String chantierId;

    @NotNull
    private LocalDate dateBesoin;

    @NotNull
    private LocalDate dateExpiration;

    @Size(max = 100)
    private String createdBy;

    @Size(max = 2000)
    private String motif;
}
