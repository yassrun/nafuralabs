package ma.nafura.chantiers.api.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.List;
import lombok.Data;

@Data
public class AttachementChantierCreateDto {

    @NotNull
    private LocalDate date;

    private String meteoCode;
    private Integer temperatureC;

    @NotNull
    private Integer effectifPresent;

    @Valid
    private List<AttachementLigneInputDto> lignes;

    private String signatureMoeDataUrl;
}
