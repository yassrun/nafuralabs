package ma.nafura.platform.collaboration.docmanager.service;

import ma.nafura.platform.collaboration.docmanager.domain.enums.DocumentStatus;
import ma.nafura.platform.collaboration.docmanager.domain.model.Document;
import ma.nafura.platform.collaboration.docmanager.domain.model.RecordAttachment;
import ma.nafura.platform.collaboration.docmanager.repository.DocumentRepository;
import ma.nafura.platform.collaboration.docmanager.repository.RecordAttachmentRepository;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

@Component
public class TenantObjectIndex {

    private final RecordAttachmentRepository pieces;
    private final DocumentRepository tenus;

    public TenantObjectIndex(RecordAttachmentRepository pieces, DocumentRepository tenus) {
        this.pieces = pieces;
        this.tenus = tenus;
    }

    public Optional<String> keyFor(UUID tenantId, String checksum) {
        if (pieces != null) {
            Optional<String> pieceKey = pieces.findFirstByTenantIdAndChecksumSha256(tenantId, checksum)
                    .map(RecordAttachment::getFileUrl);
            if (pieceKey.isPresent()) {
                return pieceKey;
            }
        }
        if (tenus == null) {
            return Optional.empty();
        }
        return tenus.findFirstByTenantIdAndChecksumSha256AndStatus(
                        tenantId, checksum, DocumentStatus.UPLOADED)
                .map(Document::getStorageKey);
    }

    public boolean othersStillPointAt(UUID tenantId, String key) {
        long pieceRefs = pieces == null ? 0 : pieces.countByTenantIdAndFileUrl(tenantId, key);
        long tenuRefs = tenus == null ? 0 : tenus.countByTenantIdAndStorageKeyAndStatus(
                tenantId, key, DocumentStatus.UPLOADED);
        return pieceRefs + tenuRefs > 0;
    }
}
