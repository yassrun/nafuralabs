package ma.nafura.hse.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import lombok.Data;

@Data
public class PhsCreateDto {

    private String id;

    @NotBlank
    private String numero;

    @NotBlank
    private String titre;

    private Integer version;

    @NotNull
    private LocalDate dateRevision;

    @NotBlank
    private String auteurNom;

    private String contenu;

    private String status;
}
