package ma.nafura.achats.api.dto;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppelOffreComparatifDto {

    private UUID aoId;

    @Builder.Default
    private List<ScoringAODto> scores = new ArrayList<>();
}
