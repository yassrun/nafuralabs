package ma.nafura.platform.documents.docextractor.api.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Response DTO for record search with pagination metadata.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecordSearchResponse {
    
    /**
     * Pagination metadata.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PageInfo {
        @JsonProperty("index")
        private Integer index;        // 0-based page index
        @JsonProperty("size")
        private Integer size;          // page size
        @JsonProperty("totalItems")
        private Long totalItems;       // total number of items matching filters
        @JsonProperty("totalPages")
        private Integer totalPages;    // total number of pages
    }
    
    private List<ExtractedRecordDto> items;
    private PageInfo page;
}

