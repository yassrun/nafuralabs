package ma.nafura.chantiers.api.request;

import java.time.LocalDate;
import java.util.List;
import lombok.Data;

@Data
public class DocumentChantierUpdateDto {

    private String type;
    private String titre;
    private String fichier;
    private String storageKey;
    private Long taille;
    private LocalDate uploadedAt;
    private String uploadedPar;
    private List<String> tags;
}
