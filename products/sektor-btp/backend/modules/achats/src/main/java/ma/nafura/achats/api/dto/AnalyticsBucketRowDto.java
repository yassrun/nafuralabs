package ma.nafura.achats.api.dto;

import java.util.LinkedHashMap;
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

    public static AnalyticsBucketRowDto of(List<String> keys, Map<String, Number> metrics) {
        return AnalyticsBucketRowDto.builder()
                .keys(keys)
                .metrics(metrics != null ? new LinkedHashMap<>(metrics) : new LinkedHashMap<>())
                .build();
    }
}
