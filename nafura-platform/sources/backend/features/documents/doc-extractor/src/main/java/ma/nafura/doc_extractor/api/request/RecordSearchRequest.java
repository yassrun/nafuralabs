package ma.nafura.platform.documents.docextractor.api.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request DTO for searching extracted records with filters and pagination.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecordSearchRequest {
    
    /**
     * Context for filtering by domain/docType/version.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Context {
        private String domainKey;
        private String docTypeKey;
        private Integer version;
    }
    
    /**
     * Pagination parameters.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PageRequest {
        @JsonProperty("index")
        private Integer index; // 0-based page index
        @JsonProperty("size")
        private Integer size;   // page size
    }
    
    /**
     * Sort specification.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SortRequest {
        private String field; // field name to sort by
        private String dir;   // "ASC" or "DESC"
    }
    
    /**
     * Filter parameters.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Filters {
        private String status;              // optional: "DRAFT", "VALIDATED", "EXPORTED", "ERROR"
        @JsonProperty("dateField")
        private String dateField;           // optional: "CREATED_AT" or "EXTRACTED_AT" (default CREATED_AT)
        @JsonProperty("dateFrom")
        private String dateFrom;            // optional: ISO date string (inclusive)
        @JsonProperty("dateTo")
        private String dateTo;              // optional: ISO date string (inclusive)
    }
    
    private Context context;
    private PageRequest page;
    private List<SortRequest> sort;
    private Filters filters;
}

