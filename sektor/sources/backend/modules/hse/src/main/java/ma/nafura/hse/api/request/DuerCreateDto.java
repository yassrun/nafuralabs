package ma.nafura.hse.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import lombok.Data;

@Data
public class DuerCreateDto {

    private String id;

    @NotBlank
    private String chantierId;

    @NotBlank
    private String chantierCode;

    @NotBlank
    private String chantierName;

    private String version;

    @NotNull
    private LocalDate dateRevision;

    private String auteurId;

    @NotBlank
    private String auteurNom;

    private Integer risquesIdentifies;

    private Integer actionsCorrectives;

    private String observations;

    private String status;
}
