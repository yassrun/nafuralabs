package ma.nafura.chantiers.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChantierLookupDto {

    private String id;
    private String code;
    private String label;
    private String status;
}
