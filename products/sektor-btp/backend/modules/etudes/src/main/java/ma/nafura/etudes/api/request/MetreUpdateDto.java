package ma.nafura.etudes.api.request;

import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import lombok.Data;

@Data
public class MetreUpdateDto {

    private String projetNom;

    private String ville;

    private LocalDate dateMetre;

    private String metreurId;

    private String metreurName;

    private String notes;

    private String status;

    @Valid
    private List<MetreLigneInputDto> lignes;
}
