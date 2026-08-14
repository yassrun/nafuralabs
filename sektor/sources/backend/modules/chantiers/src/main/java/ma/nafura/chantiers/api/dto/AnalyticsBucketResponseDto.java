package ma.nafura.chantiers.api.dto;

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

    public static AnalyticsBucketResponseDto of(List<String> dimensions, List<AnalyticsBucketRowDto> rows) {
        return AnalyticsBucketResponseDto.builder()
                .dimensions(dimensions != null ? List.copyOf(dimensions) : List.of())
                .rows(rows != null ? new ArrayList<>(rows) : new ArrayList<>())
                .build();
    }
}
