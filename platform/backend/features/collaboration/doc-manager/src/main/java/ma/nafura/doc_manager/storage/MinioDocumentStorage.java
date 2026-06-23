package ma.nafura.platform.collaboration.docmanager.storage;

import ma.nafura.platform.collaboration.docmanager.config.MinioProperties;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.GetObjectArgs;
import io.minio.RemoveObjectArgs;
import io.minio.StatObjectArgs;
import io.minio.errors.MinioException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class MinioDocumentStorage implements DocumentStorage {
    
    private final MinioClient minioClient;
    private final MinioProperties minioProperties;
    
    private static final DateTimeFormatter YEAR_FORMATTER = DateTimeFormatter.ofPattern("yyyy");
    private static final DateTimeFormatter MONTH_FORMATTER = DateTimeFormatter.ofPattern("MM");
    
    @Override
    public String upload(UUID tenantId, UUID documentId, String fileName, InputStream inputStream, String contentType) {
        try {
            String storageKey = buildStorageKey(tenantId, documentId, fileName);
            
            minioClient.putObject(
                PutObjectArgs.builder()
                    .bucket(minioProperties.getBucket())
                    .object(storageKey)
                    .stream(inputStream, -1, 10485760) // 10MB part size
                    .contentType(contentType)
                    .build()
            );
            
            log.info("Uploaded document {} to storage key: {}", documentId, storageKey);
            return storageKey;
        } catch (Exception e) {
            log.error("Failed to upload document {}: {}", documentId, e.getMessage(), e);
            throw new StorageException("Failed to upload document", e);
        }
    }
    
    @Override
    public InputStream download(String storageKey) {
        try {
            return minioClient.getObject(
                GetObjectArgs.builder()
                    .bucket(minioProperties.getBucket())
                    .object(storageKey)
                    .build()
            );
        } catch (Exception e) {
            log.error("Failed to download document from storage key {}: {}", storageKey, e.getMessage(), e);
            throw new StorageException("Failed to download document", e);
        }
    }
    
    @Override
    public void delete(String storageKey) {
        try {
            minioClient.removeObject(
                RemoveObjectArgs.builder()
                    .bucket(minioProperties.getBucket())
                    .object(storageKey)
                    .build()
            );
            log.info("Deleted document from storage key: {}", storageKey);
        } catch (Exception e) {
            log.error("Failed to delete document from storage key {}: {}", storageKey, e.getMessage(), e);
            throw new StorageException("Failed to delete document", e);
        }
    }
    
    @Override
    public boolean exists(String storageKey) {
        try {
            minioClient.statObject(
                StatObjectArgs.builder()
                    .bucket(minioProperties.getBucket())
                    .object(storageKey)
                    .build()
            );
            return true;
        } catch (MinioException e) {
            return false;
        } catch (Exception e) {
            log.error("Error checking existence of storage key {}: {}", storageKey, e.getMessage(), e);
            return false;
        }
    }
    
    private String buildStorageKey(UUID tenantId, UUID documentId, String fileName) {
        LocalDate now = LocalDate.now();
        String year = now.format(YEAR_FORMATTER);
        String month = now.format(MONTH_FORMATTER);
        
        // Format: {tenantId}/{yyyy}/{mm}/{documentId}/{originalFileName}
        return String.format("%s/%s/%s/%s/%s", 
            tenantId.toString(), 
            year, 
            month, 
            documentId.toString(), 
            fileName
        );
    }
    
    public static class StorageException extends RuntimeException {
        public StorageException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}

