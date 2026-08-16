package ma.nafura.platform.collaboration.docmanager.service;

import ma.nafura.platform.collaboration.docmanager.domain.enums.DocumentStatus;
import ma.nafura.platform.collaboration.docmanager.domain.enums.DocumentType;
import ma.nafura.platform.collaboration.docmanager.domain.model.Document;
import ma.nafura.platform.collaboration.docmanager.repository.DocumentRepository;
import ma.nafura.platform.collaboration.docmanager.storage.ContentFingerprint;
import ma.nafura.platform.collaboration.docmanager.storage.DocumentLimits;
import ma.nafura.platform.collaboration.docmanager.storage.DocumentStorage;
import ma.nafura.platform.framework.api.error.PayloadTooLargeException;
import ma.nafura.platform.framework.api.error.StorageQuotaExceededException;
import ma.nafura.platform.framework.service.crud.CrudException;
import ma.nafura.platform.framework.service.crud.CrudNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.time.OffsetDateTime;
import java.util.UUID;

@Slf4j
@Service
public class DocumentService {
    
    private final DocumentRepository documentRepository;
    private final DocumentStorage documentStorage;
    private final DocumentQuotaPolicy quota;
    private final TenantObjectIndex index;

    public DocumentService(DocumentRepository documentRepository, DocumentStorage documentStorage) {
        this(documentRepository, documentStorage, DocumentQuotaPolicy.unlimited(),
                new TenantObjectIndex(null, documentRepository));
    }

    public DocumentService(
            DocumentRepository documentRepository,
            DocumentStorage documentStorage,
            DocumentQuotaPolicy quota) {
        this(documentRepository, documentStorage, quota, new TenantObjectIndex(null, documentRepository));
    }

    @Autowired
    public DocumentService(
            DocumentRepository documentRepository,
            DocumentStorage documentStorage,
            DocumentQuotaPolicy quota,
            TenantObjectIndex index) {
        this.documentRepository = documentRepository;
        this.documentStorage = documentStorage;
        this.quota = quota != null ? quota : DocumentQuotaPolicy.unlimited();
        this.index = index != null ? index : new TenantObjectIndex(null, documentRepository);
    }
    
    @Transactional
    public Document uploadDocument(
            UUID tenantId,
            MultipartFile file,
            DocumentType docType,
            OffsetDateTime occurredAt,
            UUID uploadedByUserId) {
        try {
            DocumentLimits.refuseIfTooLarge(file.getSize());
            return uploadDocument(
                tenantId,
                file.getBytes(),
                file.getOriginalFilename(),
                file.getContentType(),
                docType,
                occurredAt,
                uploadedByUserId
            );
        } catch (PayloadTooLargeException | StorageQuotaExceededException | DocumentServiceException e) {
            throw e;
        } catch (Exception e) {
            throw new DocumentServiceException("Failed to upload document", e);
        }
    }

    @Transactional
    public Document uploadDocument(
            UUID tenantId,
            byte[] fileBytes,
            String fileName,
            String contentType,
            DocumentType docType,
            OffsetDateTime occurredAt,
            UUID uploadedByUserId) {
        
        try {
            DocumentLimits.refuseIfTooLarge(fileBytes == null ? 0 : fileBytes.length);
            // Generate document ID first
            UUID documentId = UUID.randomUUID();
            
            if (fileName == null || fileName.isEmpty()) {
                fileName = "unnamed";
            }
            
            if (contentType == null) {
                contentType = "application/octet-stream";
            }
            
            String checksum = ContentFingerprint.sha256(fileBytes);

            var existingKey = index.keyFor(tenantId, checksum)
                    .filter(documentStorage::exists);
            quota.refuseIfNewObjectExceeds(fileBytes.length, existingKey.isPresent());
            String storageKey = existingKey.orElse(null);
            boolean storedNow = storageKey == null;
            if (storedNow) {
                try {
                    storageKey = documentStorage.upload(
                        tenantId,
                        documentId,
                        fileName,
                        new ByteArrayInputStream(fileBytes),
                        contentType
                    );
                } catch (PayloadTooLargeException e) {
                    throw e;
                } catch (Exception e) {
                    log.error("Failed to upload document {} to MinIO: {}", documentId, e.getMessage(), e);
                    throw new DocumentServiceException("Failed to upload document to storage", e);
                }
            }
            
            // Create document entity with all information including storage key
            Document document = Document.builder()
                .id(documentId)
                .tenantId(tenantId)
                .fileName(fileName)
                .mimeType(contentType)
                .storageKey(storageKey)
                .checksumSha256(checksum)
                .fileSizeBytes((long) fileBytes.length)
                .docType(docType != null ? docType : DocumentType.OTHER)
                .status(DocumentStatus.UPLOADED)
                .occurredAt(occurredAt)
                .uploadedByUserId(uploadedByUserId)
                .build();
            
            // Save document in database (single save operation)
            Document saved;
            try {
                saved = documentRepository.save(document);
            } catch (Exception e) {
                log.error("Failed to save document {} to database, cleaning up MinIO storage: {}", 
                    documentId, e.getMessage());
                if (storedNow) {
                    try {
                        documentStorage.delete(storageKey);
                        log.info("Cleaned up MinIO storage for failed document {}", documentId);
                    } catch (Exception cleanupException) {
                        log.warn("Failed to clean up MinIO storage for document {}: {}", 
                            documentId, cleanupException.getMessage());
                    }
                }
                throw new DocumentServiceException("Failed to save document to database", e);
            }
            
            log.info("Document {} uploaded successfully for tenant {}", saved.getId(), tenantId);
            
            return saved;
        } catch (PayloadTooLargeException | StorageQuotaExceededException | DocumentServiceException e) {
            // Re-throw typed exceptions (do not wrap as generic DocumentServiceException)
            throw e;
        } catch (Exception e) {
            log.error("Failed to upload document for tenant {}: {}", tenantId, e.getMessage(), e);
            throw new DocumentServiceException("Failed to upload document", e);
        }
    }
    
    @Transactional(readOnly = true)
    public Document getDocument(UUID documentId, UUID tenantId) {
        return documentRepository.findByIdAndTenantId(documentId, tenantId)
            .orElseThrow(() -> new DocumentNotFoundException(
                "Document not found: " + documentId + " for tenant: " + tenantId));
    }
    
    @Transactional(readOnly = true)
    public InputStream downloadDocument(UUID documentId, UUID tenantId) {
        Document document = getDocument(documentId, tenantId);
        
        if (document.getStatus() == DocumentStatus.DELETED) {
            throw new DocumentServiceException("Document is deleted");
        }
        
        return documentStorage.download(document.getStorageKey());
    }
    
    @Transactional
    public void deleteDocument(UUID documentId, UUID tenantId) {
        Document document = getDocument(documentId, tenantId);
        
        // Soft delete: mark as DELETED in DB
        document.setStatus(DocumentStatus.DELETED);
        documentRepository.save(document);

        String storageKey = document.getStorageKey();
        if (!index.othersStillPointAt(tenantId, storageKey)) {
            try {
                documentStorage.delete(storageKey);
                log.info("Document {} deleted from storage", documentId);
            } catch (Exception e) {
                log.warn("Failed to delete document {} from storage: {}", documentId, e.getMessage());
            }
        }
    }
    
    public static class DocumentServiceException extends CrudException {
        public DocumentServiceException(String message) {
            super(message);
        }
        
        public DocumentServiceException(String message, Throwable cause) {
            super(message, cause);
        }
    }
    
    public static class DocumentNotFoundException extends CrudNotFoundException {
        public DocumentNotFoundException(String message) {
            super(message);
        }
    }
}


