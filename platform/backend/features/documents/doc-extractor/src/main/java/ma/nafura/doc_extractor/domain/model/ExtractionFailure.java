package ma.nafura.platform.documents.docextractor.domain.model;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ExtractionFailure {
    private String code;
    private String message;
    private boolean retryable;
    private String correlationId;
}

