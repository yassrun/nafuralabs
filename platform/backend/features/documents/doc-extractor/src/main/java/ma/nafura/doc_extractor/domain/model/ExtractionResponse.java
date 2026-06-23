package ma.nafura.platform.documents.docextractor.domain.model;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import ma.nafura.platform.documents.docextractor.api.response.DedupDto;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ExtractionResponse {
    private String requestId;
    private String tenantId;
    private String provider;
    private String model;
    private String extractedJson;
    private Double costUsd;
    private Instant createdAt;
    
    // DDOP fields
    private String recordId;
    private String status;
    private DedupDto dedup;
    
    // Error information (for failed extractions)
    private String error;
}

