package ma.nafura.approbations.api.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ApprovalIntegrityResultDto {

    private boolean valid;
    private int eventCount;
    private String message;
}
