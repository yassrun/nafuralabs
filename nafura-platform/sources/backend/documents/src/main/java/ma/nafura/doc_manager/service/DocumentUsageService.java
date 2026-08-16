package ma.nafura.platform.collaboration.docmanager.service;

import ma.nafura.platform.collaboration.docmanager.domain.enums.DocumentStatus;
import ma.nafura.platform.collaboration.docmanager.domain.model.Document;
import ma.nafura.platform.collaboration.docmanager.domain.model.RecordAttachment;
import ma.nafura.platform.collaboration.docmanager.repository.DocumentRepository;
import ma.nafura.platform.collaboration.docmanager.repository.RecordAttachmentRepository;
import ma.nafura.platform.framework.context.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DocumentUsageService {

    private final RecordAttachmentRepository attachmentRepository;
    private final DocumentRepository documentRepository;

    @Transactional(readOnly = true)
    public long usageBytesOfCurrentTenant() {
        UUID tenantId = TenantContext.getTenantId();
        Set<String> seen = new HashSet<>();
        long total = 0;
        for (RecordAttachment piece : attachmentRepository.findByTenantId(tenantId)) {
            String key = piece.getChecksumSha256() != null
                    ? piece.getChecksumSha256()
                    : piece.getFileUrl();
            if (key == null || !seen.add(key)) {
                continue;
            }
            total += piece.getSizeBytes() != null ? piece.getSizeBytes() : 0;
        }
        for (Document tenu : documentRepository.findByTenantId(tenantId)) {
            if (tenu.getStatus() != DocumentStatus.UPLOADED) {
                continue;
            }
            String key = tenu.getChecksumSha256() != null
                    ? tenu.getChecksumSha256()
                    : tenu.getStorageKey();
            if (key == null || !seen.add(key)) {
                continue;
            }
            total += tenu.getFileSizeBytes() != null ? tenu.getFileSizeBytes() : 0;
        }
        return total;
    }
}
