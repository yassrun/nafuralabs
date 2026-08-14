package ma.nafura.chantiers.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import lombok.Data;

@Data
public class JournalChantierCreateDto {

    @NotNull
    private LocalDate date;

    @NotBlank
    private String auteur;

    @NotBlank
    private String contenu;

    private String type;
}
