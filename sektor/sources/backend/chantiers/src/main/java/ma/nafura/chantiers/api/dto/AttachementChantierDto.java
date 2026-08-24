package ma.nafura.chantiers.api.dto;

import java.time.LocalDate;
import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AttachementChantierDto {

    private String id;
    private String numero;
    private String chantierId;
    private String chantierCode;
    /** AC-10 — la période couverte, pas un jour. */
    private LocalDate dateDebut;
    private LocalDate dateFin;
    private String meteoCode;
    private Integer temperatureC;
    private Integer effectifPresent;
    private List<AttachementLigneDto> lignes;
    private String status;
    private String signatureMoeDataUrl;
}
