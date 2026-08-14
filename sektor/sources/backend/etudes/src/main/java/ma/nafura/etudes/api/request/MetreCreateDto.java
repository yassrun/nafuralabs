package ma.nafura.etudes.api.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import lombok.Data;

@Data
public class MetreCreateDto {

    @NotBlank
    private String projetNom;

    private String ville;

    @NotNull
    private LocalDate dateMetre;

    @NotBlank
    private String metreurId;

    private String metreurName;

    private String notes;

    private String status;

    @Valid
    private List<MetreLigneInputDto> lignes = new ArrayList<>();
}
