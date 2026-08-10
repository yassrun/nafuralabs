package ma.nafura.etudes.api.dto;

import java.util.List;
import java.util.UUID;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RattrapageGroupeDto {
    private String libelle;
    private String libelleNormalise;
    private int count;
    private List<UUID> composantIds;
    private List<UUID> noeudIds;
}
