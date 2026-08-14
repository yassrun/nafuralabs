package ma.nafura.ventes.api.dto;

import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnalyticsBucketResponseDto {
    private List<String> dimensions;
    private List<AnalyticsBucketRowDto> rows;
}
