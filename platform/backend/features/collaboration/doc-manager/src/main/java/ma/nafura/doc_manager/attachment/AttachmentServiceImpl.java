package ma.nafura.platform.collaboration.docmanager.attachment;

import ma.nafura.platform.collaboration.docmanager.domain.model.RecordAttachment;
import ma.nafura.platform.collaboration.docmanager.repository.RecordAttachmentRepository;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.context.UserContext;
import ma.nafura.platform.framework.service.crud.CrudNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.OffsetDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AttachmentServiceImpl implements AttachmentService {

    private final RecordAttachmentRepository attachmentRepository;
    private final FileStorageService fileStorage;

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
        long size = file.getSize();
        String storedKey;
        try {
            storedKey = fileStorage.store(tenantId, entityType, entityId, fileName, mimeType,
                    file.getInputStream(), size);
        } catch (IOException e) {
            throw new FileStorageException("Failed to read uploaded file", e);
        }
        RecordAttachment attachment = RecordAttachment.builder()
                .tenantId(tenantId)
                .entityType(entityType)
                .entityId(entityId)
                .fileName(fileName)
                .fileUrl(storedKey)
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
        RecordAttachment attachment = attachmentRepository.findByIdAndTenantId(attachmentId, TenantContext.getTenantId())
                .orElseThrow(() -> new CrudNotFoundException("Attachment not found: " + attachmentId));
        fileStorage.delete(attachment.getFileUrl());
        attachmentRepository.delete(attachment);
    }

    @Override
    public String getDownloadUrl(RecordAttachment attachment) {
        return fileStorage.getDownloadUrl(attachment.getFileUrl());
    }
}


