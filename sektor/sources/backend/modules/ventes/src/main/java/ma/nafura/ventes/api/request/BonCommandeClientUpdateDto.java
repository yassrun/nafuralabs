package ma.nafura.ventes.api.request;

import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import lombok.Data;

@Data
public class BonCommandeClientUpdateDto {

    private String numeroClient;

    private String clientId;

    private String clientName;

    private String chantierId;

    private String chantierCode;

    private LocalDate dateReception;

    private LocalDate dateFinPrevue;

    private BigDecimal tvaTaux;

    private BigDecimal montantFactureHt;

    private String status;

    private String notes;

    @Valid
    private List<BonCommandeClientLigneInputDto> lignes;
}
