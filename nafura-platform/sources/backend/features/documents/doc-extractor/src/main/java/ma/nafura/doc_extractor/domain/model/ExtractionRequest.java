package ma.nafura.platform.documents.docextractor.domain.model;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ExtractionRequest {
    private String documentType;
    private String schemaName;
    private String schema;
    private String mimeType;
    private String contentBase64;
    private String url; // optional URL for document
    private Map<String, Object> metadata;
}

