package ma.nafura.chantiers.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.List;
import lombok.Data;

@Data
public class DocumentChantierCreateDto {

    @NotBlank
    private String type;

    @NotBlank
    private String titre;

    @NotBlank
    private String fichier;

    /** Storage key returned by platform attachment upload (MinIO). */
    private String storageKey;

    @NotNull
    private Long taille;

    @NotNull
    private LocalDate uploadedAt;

    @NotBlank
    private String uploadedPar;

    private List<String> tags;
}
