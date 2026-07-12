package ma.nafura.buildintelligence.api.controller;

import lombok.RequiredArgsConstructor;
import ma.nafura.buildintelligence.api.dto.BiDtos;
import ma.nafura.buildintelligence.api.security.BiReadAccess;
import ma.nafura.buildintelligence.api.security.BiWriteAccess;
import ma.nafura.buildintelligence.documents.domain.DocumentVisibility;
import ma.nafura.buildintelligence.documents.domain.KnowledgeDocument;
import ma.nafura.buildintelligence.documents.service.KnowledgeDocumentService;
import ma.nafura.buildintelligence.extraction.domain.AnalysisJob;
import ma.nafura.buildintelligence.extraction.domain.ExtractionRun;
import ma.nafura.buildintelligence.extraction.service.DocumentAnalysisService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/build-intelligence/documents")
@RequiredArgsConstructor
public class DocumentsController {

    private final KnowledgeDocumentService documentService;
    private final DocumentAnalysisService analysisService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @BiWriteAccess
    public BiDtos.DocumentDto upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(defaultValue = "BPU_DQE") String documentType,
            @RequestParam(required = false) DocumentVisibility visibility,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String region,
            @RequestParam(required = false) String projectType,
            @AuthenticationPrincipal Jwt jwt
    ) {
        KnowledgeDocument doc = documentService.upload(
                file, documentType, visibility, city, region, projectType, actorId(jwt));
        return toDto(doc);
    }

    @GetMapping
    @BiReadAccess
    public Page<BiDtos.DocumentDto> list(Pageable pageable) {
        return documentService.list(pageable).map(this::toDto);
    }

    @GetMapping("/{id}")
    @BiReadAccess
    public BiDtos.DocumentDto get(@PathVariable UUID id) {
        return documentService.get(id).map(this::toDto)
                .orElseThrow(() -> new IllegalArgumentException("Document not found"));
    }

    @PostMapping("/{id}/analyze")
    @BiWriteAccess
    public ResponseEntity<BiDtos.JobAcceptedResponse> analyze(
            @PathVariable UUID id,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            @AuthenticationPrincipal Jwt jwt
    ) {
        AnalysisJob job = analysisService.enqueue(id, subject(jwt), idempotencyKey);
        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(new BiDtos.JobAcceptedResponse(job.getId(), job.getStatus().name()));
    }

    @GetMapping("/{id}/extractions")
    @BiReadAccess
    public List<ExtractionRun> extractions(@PathVariable UUID id) {
        return analysisService.listRuns(id);
    }

    private BiDtos.DocumentDto toDto(KnowledgeDocument doc) {
        return new BiDtos.DocumentDto(
                doc.getId(),
                doc.getFilename(),
                doc.getMimeType(),
                doc.getDocumentType(),
                doc.getProcessingStatus().name(),
                doc.getVisibility().name(),
                doc.getCreatedAt()
        );
    }

    private static String subject(Jwt jwt) {
        return jwt != null && jwt.getSubject() != null ? jwt.getSubject() : "SYSTEM";
    }

    private static UUID actorId(Jwt jwt) {
        return null;
    }
}
