package ma.nafura.platform.documents.docextractor.api.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DedupDto {
    private ExactDuplicateDto exactDuplicate;
    private NearDuplicateDto nearDuplicate;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExactDuplicateDto {
        private boolean isDuplicate;
        private String existingRecordId;
        private String existingStatus;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NearDuplicateDto {
        private boolean isNearDuplicate;
        private String candidateRecordId;
        private Integer distance;
    }
}

