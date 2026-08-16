package ma.nafura.platform.collaboration.docmanager.attachment;

import ma.nafura.platform.collaboration.docmanager.domain.model.RecordAttachment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

public interface AttachmentService {

    RecordAttachment attach(String entityType, String entityId, MultipartFile file);

    Page<RecordAttachment> listByEntity(String entityType, String entityId, Pageable pageable);

    void delete(UUID attachmentId);

    String getDownloadUrl(RecordAttachment attachment);
}

