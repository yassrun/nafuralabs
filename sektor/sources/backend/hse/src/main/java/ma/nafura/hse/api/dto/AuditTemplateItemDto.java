package ma.nafura.hse.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditTemplateItemDto {

    private String code;

    private String libelle;

    private String categorie;

    private int ordre;
}
