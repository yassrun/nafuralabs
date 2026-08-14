package ma.nafura.etudes.api.dto;

import java.util.List;
import java.util.UUID;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CapitalisationVersementResultDto {
    private int crees;
    private int remplaces;
    private int ignores;
    private List<UUID> ouvrageIds;
}
