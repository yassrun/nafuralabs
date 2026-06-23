package ma.nafura.hse.api.dto;

import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import ma.nafura.hse.domain.model.AuditHse;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditClotureResultDto {

    private AuditHse audit;

    @Builder.Default
    private List<GeneratedNcStubDto> nonConformitesGenerees = new ArrayList<>();

    private int nbNonConformitesGenerees;

    private String message;
}
