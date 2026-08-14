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
public class OffreCreateDto {

    @NotBlank
    private String clientId;

    private String clientName;

    private String chantierId;

    private String chantierCode;

    @NotNull
    private LocalDate dateEmission;

    @NotNull
    private LocalDate dateValidite;

    @NotBlank
    private String objet;

    private BigDecimal tvaTaux;

    private String status;

    private String motifRefus;

    private String notes;

    @Valid
    private List<OffreLigneInputDto> lignes = new ArrayList<>();
}
