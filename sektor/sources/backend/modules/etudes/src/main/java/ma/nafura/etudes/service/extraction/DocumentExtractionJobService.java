package ma.nafura.etudes.service.extraction;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.security.MessageDigest;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.etudes.api.request.ImportTreeRequest;
import ma.nafura.etudes.api.response.ExtractionJobDto;
import ma.nafura.etudes.domain.model.CpsDocument;
import ma.nafura.etudes.domain.model.DocumentExtractionJob;
import ma.nafura.etudes.domain.model.DossierDocument;
import ma.nafura.etudes.domain.model.DossierEtude;
import ma.nafura.etudes.repository.DocumentExtractionJobRepository;
import ma.nafura.etudes.repository.DossierDocumentRepository;
import ma.nafura.etudes.repository.DossierEtudeRepository;
import ma.nafura.etudes.service.BordereauImportService;
import ma.nafura.etudes.service.DossierDocumentService;
import ma.nafura.etudes.service.cps.CpsService;
import ma.nafura.etudes.service.port.BordereauExtractionPort;
import ma.nafura.platform.framework.context.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * Orchestration des jobs d'extraction : enqueue, claim, exécution, retries.
 *
 * <p>Le worker poller appelle {@link #claimAndExecuteNext()} ; le traitement LLM/PDF tourne hors
 * de la transaction de claim pour ne pas bloquer les connexions DB.
 */
@Service
public class DocumentExtractionJobService {

    private static final Logger log = LoggerFactory.getLogger(DocumentExtractionJobService.class);

    private static final Duration LEASE_TTL = Duration.ofMinutes(20);
    private static final Duration RETRY_BASE = Duration.ofSeconds(15);

    private final DocumentExtractionJobRepository jobRepository;
    private final DossierDocumentRepository dossierDocumentRepository;
    private final DossierEtudeRepository dossierEtudeRepository;
    private final DossierDocumentService documentService;
    private final BordereauExtractionPort bordereauExtractionPort;
    private final CpsService cpsService;
    private final ObjectMapper objectMapper;
    private final TransactionTemplate transactionTemplate;

    public DocumentExtractionJobService(
            DocumentExtractionJobRepository jobRepository,
            DossierDocumentRepository dossierDocumentRepository,
            DossierEtudeRepository dossierEtudeRepository,
            DossierDocumentService documentService,
            BordereauExtractionPort bordereauExtractionPort,
            CpsService cpsService,
            ObjectMapper objectMapper,
            PlatformTransactionManager transactionManager) {
        this.jobRepository = jobRepository;
        this.dossierDocumentRepository = dossierDocumentRepository;
        this.dossierEtudeRepository = dossierEtudeRepository;
        this.documentService = documentService;
        this.bordereauExtractionPort = bordereauExtractionPort;
        this.cpsService = cpsService;
        this.objectMapper = objectMapper;
        this.transactionTemplate = new TransactionTemplate(transactionManager);
    }

    @Transactional
    public ExtractionJobDto enqueueBordereau(UUID dossierId, UUID pieceId) {
        DossierDocument piece = requirePiece(dossierId, pieceId);
        if (!piece.contientBordereau()) {
            throw new IllegalArgumentException("etudes.bordereau.piece_sans_bordereau");
        }
        if (!bordereauExtractionPort.isAvailable()) {
            throw new IllegalStateException("etudes.bordereau.extraction_indisponible");
        }
        byte[] contenu = documentService.chargerContenu(piece);
        String hash = sha256(contenu);
        String idempotency = idempotencyKey(
                piece.getTenantId(), piece.getId(), DocumentExtractionJob.TYPE_BORDEREAU_EXTRACT, hash);

        Optional<DocumentExtractionJob> existing =
                jobRepository.findByTenantIdAndIdempotencyKey(piece.getTenantId(), idempotency);
        if (existing.isPresent()) {
            DocumentExtractionJob job = existing.get();
            if (!job.estTerminal() || DocumentExtractionJob.STATUS_SUCCEEDED.equals(job.getStatus())) {
                return ExtractionJobDto.from(job);
            }
            // Same file already failed — reuse the row (unique idempotency key).
            return relancerJobEntity(job);
        }

        DocumentExtractionJob job = DocumentExtractionJob.builder()
                .tenantId(piece.getTenantId())
                .dossierEtudeId(dossierId)
                .dossierDocumentId(pieceId)
                .jobType(DocumentExtractionJob.TYPE_BORDEREAU_EXTRACT)
                .status(DocumentExtractionJob.STATUS_QUEUED)
                .contentHash(hash)
                .idempotencyKey(idempotency)
                .progressStep("queued")
                .availableAt(OffsetDateTime.now())
                .build();
        return ExtractionJobDto.from(jobRepository.save(job));
    }

    @Transactional
    public ExtractionJobDto enqueueCpsIndex(UUID dossierId, UUID pieceId) {
        DossierDocument piece = requirePiece(dossierId, pieceId);
        if (!piece.contientCps()) {
            throw new IllegalArgumentException("etudes.document.pas_un_cps");
        }
        byte[] contenu = documentService.chargerContenu(piece);
        String hash = sha256(contenu);
        String idempotency = idempotencyKey(
                piece.getTenantId(), piece.getId(), DocumentExtractionJob.TYPE_CPS_INDEX, hash);

        Optional<DocumentExtractionJob> existing =
                jobRepository.findByTenantIdAndIdempotencyKey(piece.getTenantId(), idempotency);
        if (existing.isPresent()) {
            DocumentExtractionJob job = existing.get();
            if (!job.estTerminal() || DocumentExtractionJob.STATUS_SUCCEEDED.equals(job.getStatus())) {
                return ExtractionJobDto.from(job);
            }
            return relancerJobEntity(job);
        }

        DocumentExtractionJob job = DocumentExtractionJob.builder()
                .tenantId(piece.getTenantId())
                .dossierEtudeId(dossierId)
                .dossierDocumentId(pieceId)
                .jobType(DocumentExtractionJob.TYPE_CPS_INDEX)
                .status(DocumentExtractionJob.STATUS_QUEUED)
                .contentHash(hash)
                .idempotencyKey(idempotency)
                .progressStep("queued")
                .availableAt(OffsetDateTime.now())
                .build();
        return ExtractionJobDto.from(jobRepository.save(job));
    }

    @Transactional(readOnly = true)
    public ExtractionJobDto get(UUID dossierId, UUID jobId) {
        DocumentExtractionJob job = jobRepository
                .findByIdAndTenantId(jobId, tenantId())
                .orElseThrow(() -> new IllegalArgumentException("etudes.extraction.job_introuvable"));
        if (!dossierId.equals(job.getDossierEtudeId())) {
            throw new IllegalArgumentException("etudes.extraction.job_introuvable");
        }
        return ExtractionJobDto.from(job);
    }

    @Transactional(readOnly = true)
    public List<ExtractionJobDto> lister(UUID dossierId) {
        return jobRepository
                .findByTenantIdAndDossierEtudeIdOrderByCreatedAtDesc(tenantId(), dossierId)
                .stream()
                .map(ExtractionJobDto::from)
                .toList();
    }

    @Transactional
    public ExtractionJobDto relancer(UUID dossierId, UUID jobId) {
        DocumentExtractionJob job = jobRepository
                .findByIdAndTenantId(jobId, tenantId())
                .orElseThrow(() -> new IllegalArgumentException("etudes.extraction.job_introuvable"));
        if (!dossierId.equals(job.getDossierEtudeId())) {
            throw new IllegalArgumentException("etudes.extraction.job_introuvable");
        }
        if (!job.peutRelancer()) {
            throw new IllegalStateException("etudes.extraction.job_non_relancable");
        }
        return relancerJobEntity(job);
    }

    private ExtractionJobDto relancerJobEntity(DocumentExtractionJob job) {
        job.setStatus(DocumentExtractionJob.STATUS_QUEUED);
        job.setErrorCode(null);
        job.setErrorMessage(null);
        job.setResultJson(null);
        job.setProgressPercent(0);
        job.setProgressStep("queued");
        job.setAttemptCount(0);
        job.setAvailableAt(OffsetDateTime.now());
        job.setLeaseOwner(null);
        job.setLeaseExpiresAt(null);
        job.setStartedAt(null);
        job.setFinishedAt(null);
        return ExtractionJobDto.from(jobRepository.save(job));
    }

    /**
     * Claim + exécution d'un job. Retourne true si un job a été traité.
     * Propage le tenant du job dans {@link TenantContext} pour les services aval.
     */
    public boolean claimAndExecuteNext(String workerId) {
        UUID jobId = transactionTemplate.execute(status -> {
            OffsetDateTime now = OffsetDateTime.now();
            Optional<UUID> next = jobRepository.findNextClaimableId(now);
            if (next.isEmpty()) {
                return null;
            }
            UUID id = next.get();
            int claimed = jobRepository.claim(id, workerId, now, now.plus(LEASE_TTL));
            return claimed == 1 ? id : null;
        });
        if (jobId == null) {
            return false;
        }

        DocumentExtractionJob snapshot = jobRepository.findById(jobId).orElse(null);
        if (snapshot == null) {
            return false;
        }

        UUID previousTenant = TenantContext.getTenantIdOrNull();
        try {
            TenantContext.setTenantId(snapshot.getTenantId());
            executeClaimed(snapshot, workerId);
        } finally {
            if (previousTenant != null) {
                TenantContext.setTenantId(previousTenant);
            } else {
                TenantContext.clear();
            }
        }
        return true;
    }

    private void executeClaimed(DocumentExtractionJob job, String workerId) {
        try {
            updateProgress(job.getId(), workerId, 5, "Chargement du document…");
            DossierDocument piece = dossierDocumentRepository
                    .findByIdAndTenantId(job.getDossierDocumentId(), job.getTenantId())
                    .orElseThrow(() -> new IllegalArgumentException("etudes.document.introuvable"));
            byte[] contenu = documentService.chargerContenu(piece);

            if (DocumentExtractionJob.TYPE_BORDEREAU_EXTRACT.equals(job.getJobType())) {
                runBordereau(job, piece, contenu, workerId);
            } else if (DocumentExtractionJob.TYPE_CPS_INDEX.equals(job.getJobType())) {
                runCpsIndex(job, piece, contenu, workerId);
            } else {
                fail(job.getId(), "UNKNOWN_JOB_TYPE", "Type de job inconnu: " + job.getJobType(), false);
            }
        } catch (Exception ex) {
            log.warn("Extraction job {} failed: {}", job.getId(), ex.getMessage());
            fail(job.getId(), "EXECUTION_ERROR", safeMessage(ex), true);
        }
    }

    private void runBordereau(
            DocumentExtractionJob job, DossierDocument piece, byte[] contenu, String workerId) {
        updateProgress(job.getId(), workerId, 5, "Préparation…");
        String mime = guessMime(piece.getNomFichier());
        UUID jobId = job.getId();
        ImportTreeRequest arbre = bordereauExtractionPort.extract(
                contenu,
                piece.getNomFichier(),
                mime,
                (percent, step) -> updateProgress(jobId, workerId, percent, step));
        var diagnostics = bordereauExtractionPort.consumeDiagnostics();
        if (arbre == null || arbre.getArbre() == null || arbre.getArbre().isEmpty()) {
            fail(job.getId(), "ARBRE_VIDE", "etudes.bordereau.arbre_vide", false);
            return;
        }
        updateProgress(job.getId(), workerId, 97, "Préparation de la revue…");
        int articles = BordereauImportService.compterArticles(arbre.getArbre());
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("arbre", objectMapper.convertValue(arbre.getArbre(), new TypeReference<List<Map<String, Object>>>() {}));
        result.put("articleCount", articles);
        result.put("pieceId", piece.getId().toString());
        result.put("fileName", piece.getNomFichier());
        result.put("outcome", "REVIEW_REQUIRED");
        if (diagnostics != null) {
            result.putAll(diagnostics.toMap());
        }
        succeed(job.getId(), result);
    }

    private void runCpsIndex(
            DocumentExtractionJob job, DossierDocument piece, byte[] contenu, String workerId) {
        updateProgress(job.getId(), workerId, 40, "indexing");
        CpsDocument cps = cpsService.indexer(piece.getId(), contenu);
        updateProgress(job.getId(), workerId, 90, "linking");

        transactionTemplate.executeWithoutResult(status -> {
            DossierEtude dossier = dossierEtudeRepository
                    .findByIdAndTenantId(job.getDossierEtudeId(), job.getTenantId())
                    .orElse(null);
            if (dossier != null && cps.getId() != null) {
                dossier.setCpsDocumentId(cps.getId().toString());
                dossierEtudeRepository.save(dossier);
            }
        });

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("cpsDocumentId", cps.getId() != null ? cps.getId().toString() : null);
        result.put("statutExtraction", cps.getStatutExtraction());
        result.put("qualiteSource", cps.getQualiteSource());
        result.put("nbSections", cps.getNbSections());
        result.put("nbPages", cps.getNbPages());
        result.put("messageExtraction", cps.getMessageExtraction());

        if (CpsDocument.STATUT_TERMINE.equals(cps.getStatutExtraction())) {
            succeed(job.getId(), result);
        } else if (CpsDocument.STATUT_NON_SUPPORTE.equals(cps.getStatutExtraction())) {
            // Document conservé ; indexation indisponible (scan) — succès technique avec outcome explicite.
            result.put("outcome", "NON_SUPPORTE");
            succeed(job.getId(), result);
        } else {
            fail(job.getId(), "CPS_INDEX_FAILED",
                    cps.getMessageExtraction() != null ? cps.getMessageExtraction() : "etudes.cps.extraction.echec",
                    false);
        }
    }

    private void updateProgress(UUID jobId, String workerId, int percent, String step) {
        transactionTemplate.executeWithoutResult(status -> {
            DocumentExtractionJob job = jobRepository.findById(jobId).orElse(null);
            if (job == null || !DocumentExtractionJob.STATUS_RUNNING.equals(job.getStatus())) {
                return;
            }
            int clamped = Math.max(0, Math.min(99, percent));
            // Never regress the bar (parallel page completions can arrive out of order).
            int current = job.getProgressPercent() != null ? job.getProgressPercent() : 0;
            if (clamped >= current) {
                job.setProgressPercent(clamped);
            }
            if (step != null && !step.isBlank()) {
                job.setProgressStep(step);
            }
            jobRepository.save(job);
            jobRepository.renewLease(jobId, workerId, OffsetDateTime.now().plus(LEASE_TTL));
        });
    }

    private void succeed(UUID jobId, Map<String, Object> result) {
        transactionTemplate.executeWithoutResult(status -> {
            DocumentExtractionJob job = jobRepository.findById(jobId).orElse(null);
            if (job == null) {
                return;
            }
            job.setStatus(DocumentExtractionJob.STATUS_SUCCEEDED);
            job.setResultJson(result);
            job.setProgressPercent(100);
            job.setProgressStep("done");
            job.setErrorCode(null);
            job.setErrorMessage(null);
            job.setLeaseOwner(null);
            job.setLeaseExpiresAt(null);
            job.setFinishedAt(OffsetDateTime.now());
            jobRepository.save(job);
        });
    }

    private void fail(UUID jobId, String code, String message, boolean retryable) {
        transactionTemplate.executeWithoutResult(status -> {
            DocumentExtractionJob job = jobRepository.findById(jobId).orElse(null);
            if (job == null) {
                return;
            }
            int attempts = job.getAttemptCount() != null ? job.getAttemptCount() : 1;
            int max = job.getMaxAttempts() != null ? job.getMaxAttempts() : 3;
            if (retryable && attempts < max) {
                long backoffSeconds = RETRY_BASE.getSeconds() * (1L << Math.min(attempts - 1, 4));
                job.setStatus(DocumentExtractionJob.STATUS_QUEUED);
                job.setAvailableAt(OffsetDateTime.now().plusSeconds(backoffSeconds));
                job.setProgressStep("retry_scheduled");
                job.setErrorCode(code);
                job.setErrorMessage(truncate(message, 1000));
                job.setLeaseOwner(null);
                job.setLeaseExpiresAt(null);
            } else {
                job.setStatus(DocumentExtractionJob.STATUS_FAILED);
                job.setErrorCode(code);
                job.setErrorMessage(truncate(message, 1000));
                job.setProgressStep("failed");
                job.setLeaseOwner(null);
                job.setLeaseExpiresAt(null);
                job.setFinishedAt(OffsetDateTime.now());
            }
            jobRepository.save(job);
        });
    }

    private DossierDocument requirePiece(UUID dossierId, UUID pieceId) {
        DossierDocument piece = dossierDocumentRepository
                .findByIdAndTenantId(pieceId, tenantId())
                .orElseThrow(() -> new IllegalArgumentException("etudes.document.introuvable"));
        if (!dossierId.equals(piece.getDossierEtudeId())) {
            throw new IllegalArgumentException("etudes.document.introuvable");
        }
        return piece;
    }

    private static String idempotencyKey(UUID tenantId, UUID pieceId, String type, String hash) {
        return tenantId + ":" + pieceId + ":" + type + ":" + hash + ":" + DocumentExtractionJob.EXTRACTOR_VERSION;
    }

    private static String sha256(byte[] bytes) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(bytes));
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to hash document content", ex);
        }
    }

    private static String guessMime(String nomFichier) {
        if (nomFichier == null) {
            return "application/octet-stream";
        }
        String lower = nomFichier.toLowerCase();
        if (lower.endsWith(".pdf")) {
            return "application/pdf";
        }
        if (lower.endsWith(".xlsx")) {
            return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        }
        if (lower.endsWith(".xls")) {
            return "application/vnd.ms-excel";
        }
        if (lower.endsWith(".csv")) {
            return "text/csv";
        }
        return "application/octet-stream";
    }

    private static String safeMessage(Throwable ex) {
        if (ex == null || ex.getMessage() == null || ex.getMessage().isBlank()) {
            return "Extraction failed";
        }
        return truncate(ex.getMessage(), 1000);
    }

    private static String truncate(String value, int max) {
        if (value == null) {
            return null;
        }
        return value.length() <= max ? value : value.substring(0, max);
    }

    private static UUID tenantId() {
        return TenantContext.getTenantId();
    }
}
