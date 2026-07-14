package ma.nafura.platform.administration.usage.api.response;

public record StorageUsageSummaryResponse(
        long documentsBytes,
        long attachmentsBytes,
        long totalBytes
) {
}
