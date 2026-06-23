package ma.nafura.hse.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GeneratedNcStubDto {

    private String id;

    private String numero;

    private String description;

    private String auditLigneId;

    private String chantierId;

    private String chantierCode;
}
