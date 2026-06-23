package ma.nafura.hse.api.dto;

import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditTemplateDto {

    private String code;

    private String label;

    private String description;

    @Builder.Default
    private List<AuditTemplateItemDto> items = new ArrayList<>();
}
