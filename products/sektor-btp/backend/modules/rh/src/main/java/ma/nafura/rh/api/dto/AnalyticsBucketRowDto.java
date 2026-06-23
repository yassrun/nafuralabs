package ma.nafura.rh.api.dto;

import java.util.List;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnalyticsBucketRowDto {
    private List<String> keys;
    private Map<String, Number> metrics;
}
