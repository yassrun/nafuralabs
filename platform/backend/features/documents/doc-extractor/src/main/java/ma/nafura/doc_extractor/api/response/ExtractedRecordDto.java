package ma.nafura.platform.documents.docextractor.api.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import ma.nafura.platform.documents.docextractor.domain.model.workflow.DocumentWorkflowStatus;
import ma.nafura.platform.documents.docextractor.domain.model.workflow.ValidationState;
import ma.nafura.platform.documents.docextractor.domain.model.workflow.CompletenessState;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExtractedRecordDto {
    private String recordId;
    private String domainKey;
    private String docTypeKey;
    private Integer docTypeVersion;
    
    /**
     * Direct reference to the exact DocTypeDefinition version used.
     * Allows precise schema lookup for record rendering.
     */
    private UUID docTypeDefinitionId;
    
    private Map<String, Object> dataJson;
    
    /**
     * Legacy status field (kept for backward compatibility).
     * @deprecated Use workflowStatus instead
     */
    @Deprecated
    private String status;
    
    /**
     * Primary workflow status.
     */
    private DocumentWorkflowStatus workflowStatus;
    
    /**
     * Validation state (only relevant for DRAFT).
     */
    private ValidationState validationState;
    
    /**
     * Completeness state (only relevant for DRAFT).
     */
    private CompletenessState completenessState;
    
    /**
     * Number of validation errors (only when validationState = INVALID).
     */
    private Integer errorCount;
    
    /**
     * Rejection reason (only when workflowStatus = REJECTED).
     */
    private String rejectionReason;
    
    private UUID storedDocumentId;

    // Source file metadata (present even when the binary isn't stored)
    private String sourceFileName;
    private String sourceMimeType;
    private Long sourceFileSizeBytes;
    
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSSXXX")
    private OffsetDateTime createdAt;
}

