package ma.nafura.stock.api.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import lombok.Data;

@Data
public class InventoryTxWithLinesUpdateDto {

    private LocalDate txDate;

    @Size(max = 100)
    private String reference;

    @Size(max = 2000)
    private String notes;

    private UUID warehouseId;
    private UUID sourceLocationId;
    private UUID destLocationId;
    private UUID fournisseurId;
    private UUID chantierLocationId;
    private String chantierBudgetId;
    private String phaseRef;
    private UUID motifId;
    private UUID bcId;

    @Valid
    private List<InventoryTxLineInputDto> lines;
}
