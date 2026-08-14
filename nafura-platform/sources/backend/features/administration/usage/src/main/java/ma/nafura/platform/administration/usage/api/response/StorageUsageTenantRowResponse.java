package ma.nafura.platform.administration.usage.api.response;

public record StorageUsageTenantRowResponse(
        String tenantId,
        long documentsBytes,
        long attachmentsBytes,
        long totalBytes
) {
}
