package ma.nafura.buildintelligence.extraction.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import ma.nafura.buildintelligence.documents.domain.DocumentProcessingStatus;
import ma.nafura.buildintelligence.documents.domain.KnowledgeDocument;
import ma.nafura.buildintelligence.documents.repository.KnowledgeDocumentRepository;
import ma.nafura.buildintelligence.extraction.domain.AnalysisJob;
import ma.nafura.buildintelligence.extraction.domain.AnalysisJobStatus;
import ma.nafura.buildintelligence.extraction.domain.AnalysisRoute;
import ma.nafura.buildintelligence.extraction.domain.ExtractedFact;
import ma.nafura.buildintelligence.extraction.domain.ExtractionRun;
import ma.nafura.buildintelligence.extraction.domain.ReviewItem;
import ma.nafura.buildintelligence.extraction.domain.ValidationStatus;
import ma.nafura.buildintelligence.extraction.repository.AnalysisJobRepository;
import ma.nafura.buildintelligence.extraction.repository.ExtractedFactRepository;
import ma.nafura.buildintelligence.extraction.repository.ExtractionRunRepository;
import ma.nafura.buildintelligence.extraction.repository.ReviewItemRepository;
import ma.nafura.platform.ai.llm.model.LlmCallContext;
import ma.nafura.platform.ai.llm.model.LlmMode;
import ma.nafura.platform.ai.llm.model.LlmRequest;
import ma.nafura.platform.ai.llm.model.LlmResponse;
import ma.nafura.platform.ai.llm.model.ScopeType;
import ma.nafura.platform.ai.llm.service.LlmService;
import ma.nafura.platform.collaboration.docmanager.service.DocumentService;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.context.annotation.Lazy;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
public class DocumentAnalysisService {

    private static final String EXTRACTOR_VERSION = "bi-1.0.0";
    private static final String SCHEMA_VERSION = "bpu-dqe-v1";
    private static final String PROMPT_VERSION = "bi-bpu-v1";

    private final AnalysisJobRepository analysisJobRepository;
    private final ExtractionRunRepository extractionRunRepository;
    private final ExtractedFactRepository extractedFactRepository;
    private final ReviewItemRepository reviewItemRepository;
    private final KnowledgeDocumentRepository knowledgeDocumentRepository;
    private final DocumentService documentService;
    private final LlmService llmService;
    private final ObjectMapper objectMapper;
    private final ExtractionValidationService validationService;
    private final AnalysisJobAsyncLauncher asyncLauncher;

    public DocumentAnalysisService(
            AnalysisJobRepository analysisJobRepository,
            ExtractionRunRepository extractionRunRepository,
            ExtractedFactRepository extractedFactRepository,
            ReviewItemRepository reviewItemRepository,
            KnowledgeDocumentRepository knowledgeDocumentRepository,
            DocumentService documentService,
            LlmService llmService,
            ObjectMapper objectMapper,
            ExtractionValidationService validationService,
            @Lazy AnalysisJobAsyncLauncher asyncLauncher
    ) {
        this.analysisJobRepository = analysisJobRepository;
        this.extractionRunRepository = extractionRunRepository;
        this.extractedFactRepository = extractedFactRepository;
        this.reviewItemRepository = reviewItemRepository;
        this.knowledgeDocumentRepository = knowledgeDocumentRepository;
        this.documentService = documentService;
        this.llmService = llmService;
        this.objectMapper = objectMapper;
        this.validationService = validationService;
        this.asyncLauncher = asyncLauncher;
    }

    @Transactional
    public AnalysisJob enqueue(UUID documentId, String requestedBy, String idempotencyKey) {
        UUID tenantId = TenantContext.getTenantId();
        if (idempotencyKey != null) {
            Optional<AnalysisJob> existing = analysisJobRepository.findByIdempotencyKey(idempotencyKey);
            if (existing.isPresent()) {
                return existing.get();
            }
        }
        KnowledgeDocument document = knowledgeDocumentRepository.findByIdAndTenantId(documentId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found"));
        document.setProcessingStatus(DocumentProcessingStatus.PROCESSING);
        knowledgeDocumentRepository.save(document);

        AnalysisJob job = new AnalysisJob();
        job.setTenantId(tenantId);
        job.setDocumentId(documentId);
        job.setStatus(AnalysisJobStatus.QUEUED);
        job.setRoute(resolveRoute(document));
        job.setPromptVersion(PROMPT_VERSION);
        job.setRequestedBy(requestedBy);
        job.setIdempotencyKey(idempotencyKey);
        job.setProgress(Map.of("step", "queued", "percent", 0));
        AnalysisJob saved = analysisJobRepository.save(job);
        asyncLauncher.launch(saved.getId());
        return saved;
    }

    @Transactional(readOnly = true)
    public Optional<AnalysisJob> getJob(UUID jobId) {
        return analysisJobRepository.findByIdAndTenantId(jobId, TenantContext.getTenantId());
    }

    @Transactional(readOnly = true)
    public List<ExtractionRun> listRuns(UUID documentId) {
        return extractionRunRepository.findByDocumentIdAndTenantIdOrderByCreatedAtDesc(
                documentId, TenantContext.getTenantId());
    }

    @Async
    @Transactional
    public void execute(UUID jobId) {
        AnalysisJob job = analysisJobRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job not found"));
        UUID tenantId = job.getTenantId();
        TenantContext.setTenantId(tenantId);
        try {
            job.setStatus(AnalysisJobStatus.RUNNING);
            job.setStartedAt(OffsetDateTime.now());
            job.setProgress(Map.of("step", "extracting", "percent", 20));
            analysisJobRepository.save(job);

            KnowledgeDocument document = knowledgeDocumentRepository.findByIdAndTenantId(job.getDocumentId(), tenantId)
                    .orElseThrow();
            byte[] bytes = documentService.downloadDocument(document.getStoredDocumentId(), tenantId).readAllBytes();

            ExtractionRun run = new ExtractionRun();
            run.setTenantId(tenantId);
            run.setDocumentId(document.getId());
            run.setAnalysisJobId(job.getId());
            run.setExtractorVersion(EXTRACTOR_VERSION);
            run.setSchemaVersion(SCHEMA_VERSION);
            run.setStatus(AnalysisJobStatus.RUNNING);
            extractionRunRepository.save(run);

            Map<String, Object> rawOutput = extractWithAi(document, bytes, job.getRoute(), tenantId, job.getRequestedBy());
            run.setRawOutput(rawOutput);
            run.setModelName((String) rawOutput.getOrDefault("modelName", "gemini"));
            run.setConfidence(BigDecimal.valueOf(((Number) rawOutput.getOrDefault("confidence", 0.75)).doubleValue()));
            run.setStatus(AnalysisJobStatus.COMPLETED);
            extractionRunRepository.save(run);

            List<Map<String, Object>> lineItems = objectMapper.convertValue(
                    rawOutput.getOrDefault("lineItems", List.of()),
                    new TypeReference<>() {}
            );
            for (Map<String, Object> line : lineItems) {
                Map<String, Object> evidence = new HashMap<>();
                evidence.put("documentId", document.getId().toString());
                evidence.put("source", line.getOrDefault("source", Map.of()));
                evidence.put("modelName", run.getModelName());
                evidence.put("promptVersion", PROMPT_VERSION);

                ExtractedFact fact = new ExtractedFact();
                fact.setTenantId(tenantId);
                fact.setExtractionRunId(run.getId());
                fact.setFactType("BPU_LINE");
                fact.setPayload(line);
                fact.setEvidence(evidence);
                fact.setConfidence(extractConfidence(line, run.getConfidence()));
                fact.setValidationStatus(ValidationStatus.PENDING_REVIEW);
                validationService.applyBusinessChecks(fact);
                extractedFactRepository.save(fact);

                ReviewItem review = new ReviewItem();
                review.setTenantId(tenantId);
                review.setExtractedFactId(fact.getId());
                review.setStatus(ValidationStatus.PENDING_REVIEW);
                reviewItemRepository.save(review);
            }

            document.setProcessingStatus(DocumentProcessingStatus.PROCESSED);
            knowledgeDocumentRepository.save(document);

            job.setStatus(AnalysisJobStatus.COMPLETED);
            job.setModelName(run.getModelName());
            job.setFinishedAt(OffsetDateTime.now());
            job.setProgress(Map.of("step", "completed", "percent", 100, "facts", lineItems.size()));
            analysisJobRepository.save(job);
        } catch (Exception ex) {
            log.error("Analysis job {} failed", jobId, ex);
            job.setStatus(AnalysisJobStatus.FAILED);
            job.setErrorMessage(ex.getMessage());
            job.setFinishedAt(OffsetDateTime.now());
            analysisJobRepository.save(job);
            knowledgeDocumentRepository.findByIdAndTenantId(job.getDocumentId(), tenantId).ifPresent(doc -> {
                doc.setProcessingStatus(DocumentProcessingStatus.FAILED);
                knowledgeDocumentRepository.save(doc);
            });
        } finally {
            TenantContext.clear();
        }
    }

    private Map<String, Object> extractWithAi(
            KnowledgeDocument document,
            byte[] bytes,
            AnalysisRoute route,
            UUID tenantId,
            String actorSub
    ) throws Exception {
        String schema = """
                {
                  "type": "object",
                  "properties": {
                    "projectMetadata": {"type": "object"},
                    "lineItems": {
                      "type": "array",
                      "items": {
                        "type": "object",
                        "properties": {
                          "lot": {"type": "string"},
                          "itemNumber": {"type": "string"},
                          "designationRaw": {"type": "string"},
                          "unit": {"type": "string"},
                          "quantity": {"type": "number"},
                          "unitPrice": {"type": "number"},
                          "totalAmount": {"type": "number"},
                          "currency": {"type": "string"},
                          "confidence": {"type": "number"},
                          "source": {"type": "object"}
                        },
                        "required": ["designationRaw", "unit"]
                      }
                    },
                    "confidence": {"type": "number"}
                  },
                  "required": ["lineItems"]
                }
                """;

        LlmRequest request = new LlmRequest();
        request.setSystemInstruction("""
                Tu es un extracteur documentaire BTP Maroc. Analyse le document et retourne uniquement un JSON conforme au schema.
                Extrais lots, désignations, unités, quantités, prix unitaires et montants quand présents.
                Chaque ligne doit inclure un champ source (page, sheet ou cellRange) et un score confidence entre 0 et 1.
                """);
        request.setResponseSchema(schema);

        List<LlmRequest.MediaContent> media = new ArrayList<>();
        LlmRequest.MediaContent content = new LlmRequest.MediaContent();
        content.setContentBase64(Base64.getEncoder().encodeToString(bytes));
        content.setMimeType(document.getMimeType() != null ? document.getMimeType() : "application/pdf");
        content.setType(LlmRequest.MediaType.DOCUMENT);
        media.add(content);
        request.setMediaContents(media);
        request.setMetadata(Map.of("route", route.name(), "documentType", document.getDocumentType()));

        LlmCallContext context = LlmCallContext.builder()
                .applicationId("build-intelligence")
                .domainKey("documents")
                .featureKey("extraction")
                .resourceKey(document.getDocumentType())
                .actionKey("analyze")
                .mode(LlmMode.ASK)
                .scopeType(ScopeType.TENANT)
                .tenantId(tenantId.toString())
                .actorSub(actorSub)
                .build();

        LlmResponse response = llmService.callLlm(request, context).get();
        Map<String, Object> parsed = objectMapper.readValue(response.getContent(), new TypeReference<>() {});
        parsed.put("modelName", response.getModel());
        return parsed;
    }

    private static AnalysisRoute resolveRoute(KnowledgeDocument document) {
        String mime = document.getMimeType() != null ? document.getMimeType() : "";
        if (mime.contains("spreadsheet") || mime.contains("excel") || mime.endsWith("json")) {
            return AnalysisRoute.NATIVE;
        }
        return AnalysisRoute.VISION;
    }

    private static BigDecimal extractConfidence(Map<String, Object> line, BigDecimal fallback) {
        Object value = line.get("confidence");
        if (value instanceof Number number) {
            return BigDecimal.valueOf(number.doubleValue()).setScale(4, RoundingMode.HALF_UP);
        }
        return fallback;
    }
}
