package ma.nafura.buildintelligence.documents.service;

import lombok.RequiredArgsConstructor;
import ma.nafura.buildintelligence.documents.domain.DocumentProcessingStatus;
import ma.nafura.buildintelligence.documents.domain.DocumentVisibility;
import ma.nafura.buildintelligence.documents.domain.KnowledgeDocument;
import ma.nafura.buildintelligence.documents.repository.KnowledgeDocumentRepository;
import ma.nafura.platform.collaboration.docmanager.domain.enums.DocumentType;
import ma.nafura.platform.collaboration.docmanager.domain.model.Document;
import ma.nafura.platform.collaboration.docmanager.service.DocumentService;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.security.MessageDigest;
import java.time.OffsetDateTime;
import java.util.HexFormat;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class KnowledgeDocumentService {

    private final KnowledgeDocumentRepository repository;
    private final DocumentService documentService;

    @Transactional(readOnly = true)
    public Page<KnowledgeDocument> list(Pageable pageable) {
        return repository.findByTenantId(TenantContext.getTenantId(), pageable);
    }

    @Transactional(readOnly = true)
    public Optional<KnowledgeDocument> get(UUID id) {
        return repository.findByIdAndTenantId(id, TenantContext.getTenantId());
    }

    @Transactional
    public KnowledgeDocument upload(
            MultipartFile file,
            String documentType,
            DocumentVisibility visibility,
            String city,
            String region,
            String projectType,
            UUID uploadedByUserId
    ) {
        UUID tenantId = TenantContext.getTenantId();
        try {
            byte[] bytes = file.getBytes();
            String sha256 = sha256(bytes);
            Optional<KnowledgeDocument> existing = repository.findByTenantIdAndSha256(tenantId, sha256);
            if (existing.isPresent()) {
                return existing.get();
            }

            Document stored = documentService.uploadDocument(
                    tenantId,
                    bytes,
                    file.getOriginalFilename(),
                    file.getContentType(),
                    DocumentType.OTHER,
                    OffsetDateTime.now(),
                    uploadedByUserId
            );

            KnowledgeDocument doc = new KnowledgeDocument();
            doc.setTenantId(tenantId);
            doc.setStoredDocumentId(stored.getId());
            doc.setObjectKey(stored.getStorageKey());
            doc.setFilename(file.getOriginalFilename());
            doc.setMimeType(file.getContentType());
            doc.setSha256(sha256);
            doc.setSizeBytes((long) bytes.length);
            doc.setDocumentType(documentType);
            doc.setVisibility(visibility != null ? visibility : DocumentVisibility.PRIVATE);
            doc.setCity(city);
            doc.setRegion(region);
            doc.setProjectType(projectType);
            doc.setProcessingStatus(DocumentProcessingStatus.DOWNLOADED);
            doc.setMetadata(Map.of("source", "manual-upload"));
            return repository.save(doc);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to upload knowledge document", e);
        }
    }

    @Transactional
    public KnowledgeDocument updateStatus(UUID id, DocumentProcessingStatus status) {
        KnowledgeDocument doc = repository.findByIdAndTenantId(id, TenantContext.getTenantId())
                .orElseThrow(() -> new IllegalArgumentException("Document not found"));
        doc.setProcessingStatus(status);
        return repository.save(doc);
    }

    private static String sha256(byte[] bytes) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        return HexFormat.of().formatHex(digest.digest(bytes));
    }
}
