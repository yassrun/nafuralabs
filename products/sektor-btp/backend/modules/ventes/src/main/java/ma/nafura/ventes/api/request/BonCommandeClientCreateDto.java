package ma.nafura.ventes.api.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import lombok.Data;

@Data
public class BonCommandeClientCreateDto {

    @NotBlank
    private String numeroClient;

    @NotBlank
    private String clientId;

    private String clientName;

    private String chantierId;

    private String chantierCode;

    @NotNull
    private LocalDate dateReception;

    private LocalDate dateFinPrevue;

    private BigDecimal tvaTaux;

    private String status;

    private String notes;

    @Valid
    private List<BonCommandeClientLigneInputDto> lignes = new ArrayList<>();
}
