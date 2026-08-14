package ma.nafura.platform.administration.usage.service;

import lombok.RequiredArgsConstructor;
import ma.nafura.platform.administration.usage.api.response.StorageUsageSummaryResponse;
import ma.nafura.platform.administration.usage.api.response.StorageUsageTenantRowResponse;
import ma.nafura.platform.collaboration.docmanager.repository.DocumentRepository;
import ma.nafura.platform.collaboration.docmanager.repository.RecordAttachmentRepository;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StorageUsageQueryService {

    private final DocumentRepository documentRepository;
    private final RecordAttachmentRepository recordAttachmentRepository;

    public StorageUsageSummaryResponse summary(UUID tenantId) {
        long documents;
        long attachments;
        if (tenantId != null) {
            documents = nullToZero(documentRepository.sumFileSizeBytesByTenantId(tenantId));
            attachments = nullToZero(recordAttachmentRepository.sumSizeBytesByTenantId(tenantId));
        } else {
            documents = nullToZero(documentRepository.sumFileSizeBytes());
            attachments = nullToZero(recordAttachmentRepository.sumSizeBytes());
        }
        return new StorageUsageSummaryResponse(documents, attachments, documents + attachments);
    }

    public List<StorageUsageTenantRowResponse> byTenant() {
        Map<String, long[]> byTenant = new HashMap<>();

        for (Object[] row : documentRepository.sumFileSizeBytesGroupedByTenant()) {
            String tenantId = row[0] != null ? row[0].toString() : null;
            if (tenantId == null) {
                continue;
            }
            long bytes = toLong(row[1]);
            byTenant.computeIfAbsent(tenantId, ignored -> new long[2])[0] = bytes;
        }

        for (Object[] row : recordAttachmentRepository.sumSizeBytesGroupedByTenant()) {
            String tenantId = row[0] != null ? row[0].toString() : null;
            if (tenantId == null) {
                continue;
            }
            long bytes = toLong(row[1]);
            byTenant.computeIfAbsent(tenantId, ignored -> new long[2])[1] = bytes;
        }

        List<StorageUsageTenantRowResponse> result = new ArrayList<>();
        for (Map.Entry<String, long[]> entry : byTenant.entrySet()) {
            long documents = entry.getValue()[0];
            long attachments = entry.getValue()[1];
            result.add(new StorageUsageTenantRowResponse(
                    entry.getKey(),
                    documents,
                    attachments,
                    documents + attachments
            ));
        }
        return result;
    }

    private static long nullToZero(Long value) {
        return value != null ? value : 0L;
    }

    private static long toLong(Object value) {
        if (value == null) {
            return 0L;
        }
        if (value instanceof Number number) {
            return number.longValue();
        }
        return Long.parseLong(value.toString());
    }
}
