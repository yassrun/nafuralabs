package ma.nafura.chantiers.api.dto;

import java.time.LocalDate;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class JournalChantierDto {

    private String id;
    private String chantierId;
    private LocalDate date;
    private String auteur;
    private String contenu;
    private String type;
}
