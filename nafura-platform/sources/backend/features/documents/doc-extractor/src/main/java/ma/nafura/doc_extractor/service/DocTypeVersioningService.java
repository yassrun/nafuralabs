package ma.nafura.platform.documents.docextractor.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import ma.nafura.platform.documents.docextractor.service.builder.DocTypeBuilderEngine;
import ma.nafura.platform.documents.docextractor.service.builder.BuilderState;
import ma.nafura.platform.documents.docextractor.service.builder.ValidationResult;
import ma.nafura.platform.framework.service.crud.CrudNotFoundException;
import ma.nafura.platform.documents.docextractor.domain.model.DocTypeDefinition;
import ma.nafura.platform.documents.docextractor.domain.model.DocTypeDefinition.Status;
import ma.nafura.platform.documents.docextractor.repository.DocTypeDefinitionRepository;
import ma.nafura.platform.documents.docextractor.api.request.*;
import ma.nafura.platform.documents.docextractor.api.response.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service for DocType versioning workflow.
 * 
 * Workflow rules:
 * - DRAFT: Editable, can be saved and published
 * - PUBLISHED: Immutable, active for use in extraction
 * - DEPRECATED: Immutable, no longer active
 * 
 * Operations:
 * 1. createDocType - Create new DocType with v1 draft
 * 2. cloneToNewDraft - Clone a version to a new draft
 * 3. saveDraft - Save changes to a draft
 * 4. publish - Validate and publish a draft
 * 5. getLatestPublished - Get latest published version
 * 6. listVersions - List all versions of a DocType
 */
@Service
public class DocTypeVersioningService {

    private final DocTypeDefinitionRepository repository;
    private final DocTypeBuilderEngine builderEngine;
    private final ObjectMapper objectMapper;

    public DocTypeVersioningService(
            DocTypeDefinitionRepository repository,
            DocTypeBuilderEngine builderEngine,
            ObjectMapper objectMapper) {
        this.repository = repository;
        this.builderEngine = builderEngine;
        this.objectMapper = objectMapper;
    }

    // ===== Command: Create DocType =====

    /**
     * Create a new DocType with version 1 as a draft.
     * 
     * @param request Create request containing domain, code, name, etc.
     * @return Created DocType definition
     */
    @Transactional
    public DocTypeDefinitionDto createDocType(CreateDocTypeRequest request) {
        // Check if a DocType with this domain/code already exists
        if (repository.existsByDomainKeyAndDocTypeKeyAndStatus(
                request.domainKey(), request.docTypeKey(), Status.DRAFT) ||
            repository.findMaxVersionByDomainKeyAndDocTypeKey(
                request.domainKey(), request.docTypeKey()).isPresent()) {
            throw new IllegalArgumentException(
                "DocType already exists: " + request.domainKey() + "/" + request.docTypeKey());
        }

        // Build initial schemas from builder state (if provided)
        String jsonSchema = "{}";
        String uiSchema = "{}";
        String builderStateJson = null;

        if (request.builderState() != null) {
            BuilderState state = parseBuilderState(request.builderState());
            jsonSchema = builderEngine.buildDataSchemaJson(state);
            uiSchema = builderEngine.buildUiSchemaJson(state);
            builderStateJson = serializeBuilderState(request.builderState());
        }

        // Create the v1 draft
        DocTypeDefinition definition = DocTypeDefinition.builder()
                .domainKey(request.domainKey())
                .docTypeKey(request.docTypeKey())
                .version(1)
                .name(request.name())
                .description(request.description())
                .promptTemplate(request.promptTemplate() != null ? request.promptTemplate() : getDefaultPromptTemplate())
                .jsonSchema(jsonSchema)
                .uiSchema(uiSchema)
                .builderState(builderStateJson)
                .status(Status.DRAFT)
                .isActive(false)
                .createdBy("system") // TODO: Get from security context
                .updatedBy("system")
                .build();

        DocTypeDefinition saved = repository.save(definition);
        return toDto(saved);
    }

    // ===== Command: Clone to New Draft =====

    /**
     * Clone an existing version to a new draft.
     * If a draft already exists, it will be replaced.
     * 
     * @param fromVersionId The version to clone from
     * @return Created draft DocType definition
     */
    @Transactional
    public DocTypeDefinitionDto cloneToNewDraft(UUID fromVersionId) {
        // Find the source version
        DocTypeDefinition source = repository.findById(fromVersionId)
            .orElseThrow(() -> new CrudNotFoundException("Version not found: " + fromVersionId));

        // Check if a draft already exists
        if (repository.existsByDomainKeyAndDocTypeKeyAndStatus(
                source.getDomainKey(), source.getDocTypeKey(), Status.DRAFT)) {
            throw new IllegalArgumentException(
                "A draft already exists for this DocType. Delete or publish it first.");
        }

        // Get max version and increment
        int maxVersion = repository.findMaxVersionByDomainKeyAndDocTypeKey(
                source.getDomainKey(), source.getDocTypeKey())
                .orElse(0);

        // Create the new draft
        DocTypeDefinition draft = DocTypeDefinition.builder()
                .domainKey(source.getDomainKey())
                .docTypeKey(source.getDocTypeKey())
                .version(maxVersion + 1)
                .name(source.getName())
                .description(source.getDescription())
                .promptTemplate(source.getPromptTemplate())
                .jsonSchema(source.getJsonSchema())
                .uiSchema(source.getUiSchema())
                .builderState(source.getBuilderState())
                .status(Status.DRAFT)
                .isActive(false)
                .createdBy("system") // TODO: Get from security context
                .updatedBy("system")
                .build();

        DocTypeDefinition saved = repository.save(draft);
        return toDto(saved);
    }

    // ===== Command: Save Draft =====

    /**
     * Save changes to a draft version.
     * Server generates schemas from builder state.
     * 
     * @param versionId Version to update
     * @param request Save request with builder state
     * @return Updated DocType definition
     */
    @Transactional
    public DocTypeDefinitionDto saveDraft(UUID versionId, SaveDraftRequest request) {
        DocTypeDefinition definition = repository.findById(versionId)
            .orElseThrow(() -> new CrudNotFoundException("Version not found: " + versionId));

        // Enforce immutability
        if (!definition.isEditable()) {
            throw new IllegalStateException(
                "Cannot edit " + definition.getStatus() + " version. Create a new draft first.");
        }

        // Update fields if provided
        if (request.name() != null) {
            definition.setName(request.name());
        }
        if (request.description() != null) {
            definition.setDescription(request.description());
        }
        if (request.promptTemplate() != null) {
            definition.setPromptTemplate(request.promptTemplate());
        }

        // Generate schemas from builder state
        if (request.builderState() != null) {
            BuilderState state = parseBuilderState(request.builderState());
            definition.setJsonSchema(builderEngine.buildDataSchemaJson(state));
            definition.setUiSchema(builderEngine.buildUiSchemaJson(state));
            definition.setBuilderState(serializeBuilderState(request.builderState()));
        }

        definition.setUpdatedBy("system"); // TODO: Get from security context
        DocTypeDefinition saved = repository.save(definition);
        return toDto(saved);
    }

    // ===== Command: Publish =====

    /**
     * Validate and publish a draft version.
     * Once published, the version becomes immutable.
     * 
     * @param versionId Version to publish
     * @return Published DocType definition
     */
    @Transactional
    public DocTypeDefinitionDto publish(UUID versionId) {
        DocTypeDefinition definition = repository.findById(versionId)
            .orElseThrow(() -> new CrudNotFoundException("Version not found: " + versionId));

        // Can only publish drafts
        if (definition.getStatus() != Status.DRAFT) {
            throw new IllegalStateException("Can only publish DRAFT versions");
        }

        // Validate the definition
        ValidationResult validation = validateForPublish(definition);
        if (!validation.isValid()) {
            throw new IllegalStateException(
                "Cannot publish: " + String.join(", ", validation.errors()));
        }

        // Deprecate previous published version
        repository.findFirstByDomainKeyAndDocTypeKeyAndStatusOrderByVersionDesc(
                definition.getDomainKey(), definition.getDocTypeKey(), Status.PUBLISHED)
                .ifPresent(prev -> {
                    prev.setStatus(Status.DEPRECATED);
                    prev.setIsActive(false);
                    repository.save(prev);
                });

        // Publish
        definition.setStatus(Status.PUBLISHED);
        definition.setIsActive(true);
        definition.setUpdatedBy("system"); // TODO: Get from security context

        DocTypeDefinition saved = repository.save(definition);
        return toDto(saved);
    }

    // ===== Query: Get Latest Published =====

    /**
     * Get the latest published version of a DocType.
     * 
     * @param domainKey Domain key
     * @param docTypeKey Doc type key
     * @return Latest published version, or null if none
     */
    @Transactional(readOnly = true)
    public DocTypeDefinitionDto getLatestPublished(String domainKey, String docTypeKey) {
        return repository.findFirstByDomainKeyAndDocTypeKeyAndStatusOrderByVersionDesc(
                domainKey, docTypeKey, Status.PUBLISHED)
                .map(this::toDto)
                .orElse(null);
    }

    // ===== Query: Get Version by ID =====

    /**
     * Get a specific version by ID.
     * 
     * @param versionId Version ID
     * @return DocType definition
     */
    @Transactional(readOnly = true)
    public DocTypeDefinitionDto getVersion(UUID versionId) {
        DocTypeDefinition definition = repository.findById(versionId)
            .orElseThrow(() -> new CrudNotFoundException("Version not found: " + versionId));

        return toDto(definition);
    }

    // ===== Query: List Versions =====

    /**
     * List all versions of a DocType.
     * 
     * @param domainKey Domain key
     * @param docTypeKey Doc type key
     * @return List of version summaries
     */
    @Transactional(readOnly = true)
    public List<DocTypeVersionSummaryDto> listVersions(String domainKey, String docTypeKey) {
        return repository.findByDomainKeyAndDocTypeKeyOrderByVersionDesc(
                domainKey, docTypeKey)
                .stream()
                .map(this::toVersionSummary)
                .collect(Collectors.toList());
    }

    // ===== Query: Validate Builder State =====

    /**
     * Validate a builder state without saving.
     * 
     * @param builderState Builder state JSON
     * @return Validation result
     */
    public ValidationResultDto validateBuilderState(JsonNode builderState) {
        try {
            BuilderState state = parseBuilderState(builderState);
            ValidationResult result = builderEngine.validateBuilderState(state);
            return new ValidationResultDto(result.isValid(), result.errors());
        } catch (Exception e) {
            return ValidationResultDto.invalid("Invalid builder state: " + e.getMessage());
        }
    }

    // ===== Private Helpers =====

    private ValidationResult validateForPublish(DocTypeDefinition definition) {
        // Validate that required fields are present
        if (definition.getName() == null || definition.getName().isBlank()) {
            return ValidationResult.invalid("Name is required");
        }
        if (definition.getPromptTemplate() == null || definition.getPromptTemplate().isBlank()) {
            return ValidationResult.invalid("Prompt template is required");
        }
        if (definition.getJsonSchema() == null || definition.getJsonSchema().isBlank() || 
            definition.getJsonSchema().equals("{}")) {
            return ValidationResult.invalid("JSON schema is required");
        }

        // Validate builder state if present
        if (definition.getBuilderState() != null && !definition.getBuilderState().isBlank()) {
            try {
                JsonNode stateJson = objectMapper.readTree(definition.getBuilderState());
                BuilderState state = parseBuilderState(stateJson);
                ValidationResult builderValidation = builderEngine.validateBuilderState(state);
                if (!builderValidation.isValid()) {
                    return builderValidation;
                }
            } catch (Exception e) {
                return ValidationResult.invalid("Invalid builder state: " + e.getMessage());
            }
        }

        return ValidationResult.valid();
    }

    private BuilderState parseBuilderState(JsonNode json) {
        try {
            return objectMapper.treeToValue(json, BuilderState.class);
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid builder state JSON: " + e.getMessage(), e);
        }
    }

    private String serializeBuilderState(JsonNode json) {
        try {
            return objectMapper.writeValueAsString(json);
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize builder state", e);
        }
    }

    private DocTypeDefinitionDto toDto(DocTypeDefinition definition) {
        return new DocTypeDefinitionDto(
                definition.getId(),
                definition.getDomainKey(),
                definition.getDocTypeKey(),
                definition.getVersion(),
                definition.getName(),
                definition.getDescription(),
                definition.getStatus().name(),
                definition.getOrigin() != null ? definition.getOrigin().name() : "SYSTEM",
                definition.getTenantId(),
                parseJson(definition.getJsonSchema()),
                parseJson(definition.getUiSchema()),
                parseJson(definition.getBuilderState()),
                definition.getPromptTemplate(),
                definition.getCreatedAt(),
                definition.getCreatedBy(),
                definition.getUpdatedAt(),
                definition.getUpdatedBy()
        );
    }

    private DocTypeVersionSummaryDto toVersionSummary(DocTypeDefinition definition) {
        return new DocTypeVersionSummaryDto(
                definition.getId(),
                definition.getVersion(),
                definition.getStatus().name(),
                definition.getName(),
                definition.getCreatedAt(),
                definition.getCreatedBy(),
                definition.getUpdatedAt(),
                definition.getUpdatedBy()
        );
    }

    private JsonNode parseJson(String raw) {
        if (raw == null || raw.isBlank()) {
            return objectMapper.createObjectNode();
        }
        try {
            return objectMapper.readTree(raw);
        } catch (Exception e) {
            return objectMapper.createObjectNode();
        }
    }

    private String getDefaultPromptTemplate() {
        return """
            You are a document extraction assistant. Extract data from the provided document.
            Return ONLY valid JSON that matches the provided JSON Schema.
            
            CRITICAL INSTRUCTIONS:
            - If a required field is not found in the document, use null.
            - Do NOT fill required fields with wrong data or placeholder text.
            - Only extract information that is explicitly visible in the document.
            - If you are uncertain about a value, use null.
            
            Formatting rules:
            - Dates must be YYYY-MM-DD format.
            - Numbers must be numeric values (not strings).
            """;
    }
}


