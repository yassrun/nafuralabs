package ma.nafura.platform.collaboration.docmanager.storage;

import java.io.InputStream;
import java.util.UUID;

public interface DocumentStorage {
    
    /**
     * Upload a document to storage
     * @param tenantId Tenant identifier
     * @param documentId Document identifier
     * @param fileName Original file name
     * @param inputStream File content stream
     * @param contentType MIME type
     * @return Storage key (path) where the file is stored
     */
    String upload(UUID tenantId, UUID documentId, String fileName, InputStream inputStream, String contentType);
    
    /**
     * Download a document from storage
     * @param storageKey Storage key (path) of the file
     * @return InputStream of the file content
     */
    InputStream download(String storageKey);
    
    /**
     * Delete a document from storage
     * @param storageKey Storage key (path) of the file
     */
    void delete(String storageKey);
    
    /**
     * Check if a document exists in storage
     * @param storageKey Storage key (path) of the file
     * @return true if exists, false otherwise
     */
    boolean exists(String storageKey);
}

