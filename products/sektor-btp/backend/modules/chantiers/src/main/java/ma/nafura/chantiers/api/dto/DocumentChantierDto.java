package ma.nafura.chantiers.api.dto;

import java.time.LocalDate;
import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DocumentChantierDto {

    private String id;
    private String chantierId;
    private String chantierCode;
    private String type;
    private String titre;
    private String fichier;
    private String storageKey;
    private Long taille;
    private LocalDate uploadedAt;
    private String uploadedPar;
    private List<String> tags;
}
