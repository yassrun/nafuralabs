package ma.nafura.platform.collaboration.docmanager.service;

import ma.nafura.platform.collaboration.docmanager.domain.enums.DocumentStatus;
import ma.nafura.platform.collaboration.docmanager.domain.enums.DocumentType;
import ma.nafura.platform.collaboration.docmanager.domain.model.Document;
import ma.nafura.platform.collaboration.docmanager.repository.DocumentRepository;
import ma.nafura.platform.collaboration.docmanager.storage.DocumentStorage;
import ma.nafura.platform.collaboration.docmanager.storage.MinioDocumentStorage;
import ma.nafura.platform.framework.service.crud.CrudException;
import ma.nafura.platform.framework.service.crud.CrudNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.security.MessageDigest;
import java.time.OffsetDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentService {
    
    private final DocumentRepository documentRepository;
    private final DocumentStorage documentStorage;
    
    @Transactional
    public Document uploadDocument(
            UUID tenantId,
            MultipartFile file,
            DocumentType docType,
            OffsetDateTime occurredAt,
            UUID uploadedByUserId) {
        try {
            return uploadDocument(
                tenantId,
                file.getBytes(),
                file.getOriginalFilename(),
                file.getContentType(),
                docType,
                occurredAt,
                uploadedByUserId
            );
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
            // Generate document ID first
            UUID documentId = UUID.randomUUID();
            
            if (fileName == null || fileName.isEmpty()) {
                fileName = "unnamed";
            }
            
            if (contentType == null) {
                contentType = "application/octet-stream";
            }
            
            // Calculate SHA-256 checksum
            String checksum = calculateChecksum(new ByteArrayInputStream(fileBytes));
            
            // Upload to MinIO first (before database save)
            String storageKey = null;
            try {
                storageKey = documentStorage.upload(
                    tenantId, 
                    documentId, 
                    fileName, 
                    new ByteArrayInputStream(fileBytes), 
                    contentType
                );
            } catch (Exception e) {
                log.error("Failed to upload document {} to MinIO: {}", documentId, e.getMessage(), e);
                throw new DocumentServiceException("Failed to upload document to storage", e);
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
                // If database save fails, clean up MinIO storage
                log.error("Failed to save document {} to database, cleaning up MinIO storage: {}", 
                    documentId, e.getMessage());
                try {
                    documentStorage.delete(storageKey);
                    log.info("Cleaned up MinIO storage for failed document {}", documentId);
                } catch (Exception cleanupException) {
                    log.warn("Failed to clean up MinIO storage for document {}: {}", 
                        documentId, cleanupException.getMessage());
                }
                throw new DocumentServiceException("Failed to save document to database", e);
            }
            
            log.info("Document {} uploaded successfully for tenant {}", saved.getId(), tenantId);
            
            return saved;
        } catch (DocumentServiceException e) {
            // Re-throw service exceptions
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
        
        // Hard delete: remove from MinIO
        try {
            documentStorage.delete(document.getStorageKey());
            log.info("Document {} deleted from storage", documentId);
        } catch (Exception e) {
            log.warn("Failed to delete document {} from storage: {}", documentId, e.getMessage());
            // Continue even if storage deletion fails
        }
    }
    
    private String calculateChecksum(InputStream inputStream) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] buffer = new byte[8192];
            int bytesRead;
            while ((bytesRead = inputStream.read(buffer)) != -1) {
                digest.update(buffer, 0, bytesRead);
            }
            byte[] hash = digest.digest();
            
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            log.warn("Failed to calculate checksum: {}", e.getMessage());
            return null;
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


