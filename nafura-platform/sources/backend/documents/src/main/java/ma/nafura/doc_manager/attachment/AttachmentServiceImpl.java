package ma.nafura.platform.collaboration.docmanager.attachment;

import ma.nafura.platform.collaboration.docmanager.domain.model.RecordAttachment;
import ma.nafura.platform.collaboration.docmanager.repository.RecordAttachmentRepository;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.context.UserContext;
import ma.nafura.platform.framework.service.crud.CrudNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import ma.nafura.platform.collaboration.docmanager.service.DocumentQuotaPolicy;
import ma.nafura.platform.collaboration.docmanager.service.TenantObjectIndex;
import ma.nafura.platform.collaboration.docmanager.storage.ContentFingerprint;
import ma.nafura.platform.collaboration.docmanager.storage.DocumentLimits;
import org.springframework.beans.factory.annotation.Autowired;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.time.OffsetDateTime;
import java.util.UUID;

@Service
public class AttachmentServiceImpl implements AttachmentService {

    private final RecordAttachmentRepository attachmentRepository;
    private final FileStorageService fileStorage;
    private final DocumentQuotaPolicy quota;
    private final TenantObjectIndex index;

    public AttachmentServiceImpl(
            RecordAttachmentRepository attachmentRepository,
            FileStorageService fileStorage) {
        this(attachmentRepository, fileStorage, DocumentQuotaPolicy.unlimited(),
                new TenantObjectIndex(attachmentRepository, null));
    }

    public AttachmentServiceImpl(
            RecordAttachmentRepository attachmentRepository,
            FileStorageService fileStorage,
            DocumentQuotaPolicy quota) {
        this(attachmentRepository, fileStorage, quota, new TenantObjectIndex(attachmentRepository, null));
    }

    @Autowired
    public AttachmentServiceImpl(
            RecordAttachmentRepository attachmentRepository,
            FileStorageService fileStorage,
            DocumentQuotaPolicy quota,
            TenantObjectIndex index) {
        this.attachmentRepository = attachmentRepository;
        this.fileStorage = fileStorage;
        this.quota = quota != null ? quota : DocumentQuotaPolicy.unlimited();
        this.index = index != null ? index : new TenantObjectIndex(attachmentRepository, null);
    }

    @Override
    @Transactional
    public RecordAttachment attach(String entityType, String entityId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is required");
        }
        if (entityId == null || entityId.isBlank()) {
            throw new IllegalArgumentException("entityId is required");
        }
        UUID tenantId = TenantContext.getTenantId();
        String uploadedBy = UserContext.getUserEmail();
        if (uploadedBy == null) {
            uploadedBy = "system";
        }
        String fileName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "file";
        String mimeType = file.getContentType();
        DocumentLimits.refuseIfTooLarge(file.getSize());
        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException e) {
            throw new FileStorageException("Failed to read uploaded file", e);
        }
        long size = bytes.length;
        DocumentLimits.refuseIfTooLarge(size);
        String checksum = ContentFingerprint.sha256(bytes);
        var existingKey = index.keyFor(tenantId, checksum);
        quota.refuseIfNewObjectExceeds(size, existingKey.isPresent());
        String storedKey = existingKey.orElseGet(() -> fileStorage.store(
                tenantId, entityType, entityId, fileName, mimeType,
                new ByteArrayInputStream(bytes), size));
        RecordAttachment attachment = RecordAttachment.builder()
                .tenantId(tenantId)
                .entityType(entityType)
                .entityId(entityId)
                .fileName(fileName)
                .fileUrl(storedKey)
                .checksumSha256(checksum)
                .mimeType(mimeType)
                .sizeBytes(size)
                .uploadedBy(uploadedBy)
                .uploadedAt(OffsetDateTime.now())
                .isPrimary(false)
                .build();
        return attachmentRepository.save(attachment);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<RecordAttachment> listByEntity(String entityType, String entityId, Pageable pageable) {
        UUID tenantId = TenantContext.getTenantId();
        return attachmentRepository.findByTenantIdAndEntityTypeAndEntityIdOrderByCreatedAtDesc(
                tenantId, entityType, entityId, pageable);
    }

    @Override
    @Transactional
    public void delete(UUID attachmentId) {
        UUID tenantId = TenantContext.getTenantId();
        RecordAttachment attachment = attachmentRepository.findByIdAndTenantId(attachmentId, tenantId)
                .orElseThrow(() -> new CrudNotFoundException("Attachment not found: " + attachmentId));
        String storedKey = attachment.getFileUrl();
        attachmentRepository.delete(attachment);
        if (!index.othersStillPointAt(tenantId, storedKey)) {
            fileStorage.delete(storedKey);
        }
    }

    @Override
    public String getDownloadUrl(RecordAttachment attachment) {
        return fileStorage.getDownloadUrl(attachment.getFileUrl());
    }
}


