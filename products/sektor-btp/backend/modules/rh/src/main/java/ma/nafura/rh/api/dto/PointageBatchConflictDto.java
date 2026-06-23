package ma.nafura.rh.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PointageBatchConflictDto {

    private String message;
    private String clientId;
    private String existingBatchId;
}
