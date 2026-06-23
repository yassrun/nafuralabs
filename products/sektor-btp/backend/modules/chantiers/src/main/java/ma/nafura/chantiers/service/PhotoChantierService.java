package ma.nafura.chantiers.service;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import ma.nafura.chantiers.api.dto.PhotoChantierDto;
import ma.nafura.chantiers.api.dto.PhotoChantierUrlDto;
import ma.nafura.chantiers.api.request.PhotoChantierCreateDto;
import ma.nafura.chantiers.domain.model.Chantier;
import ma.nafura.chantiers.domain.model.PhotoChantier;
import ma.nafura.chantiers.repository.PhotoChantierRepository;
import ma.nafura.platform.collaboration.docmanager.attachment.AttachmentService;
import ma.nafura.platform.collaboration.docmanager.attachment.FileStorageService;
import ma.nafura.platform.collaboration.docmanager.domain.model.RecordAttachment;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

@Service
public class PhotoChantierService {

    private static final String ATTACHMENT_ENTITY_TYPE = "PHOTO_CHANTIER";

    private final PhotoChantierRepository repository;
    private final ChantierService chantierService;
    private final PhotoChantierSeedService seedService;
    private final AttachmentService attachmentService;
    private final FileStorageService fileStorage;

    public PhotoChantierService(
            PhotoChantierRepository repository,
            ChantierService chantierService,
            PhotoChantierSeedService seedService,
            AttachmentService attachmentService,
            FileStorageService fileStorage) {
        this.repository = repository;
        this.chantierService = chantierService;
        this.seedService = seedService;
        this.attachmentService = attachmentService;
        this.fileStorage = fileStorage;
    }

    @Transactional(readOnly = true)
    public List<PhotoChantierDto> listByChantier(String chantierId, String zone, LocalDate date) {
        seedService.seedIfEmpty();
        Chantier chantier = chantierService.getById(chantierId);
        return repository
                .findByTenantIdAndChantierIdOrderByTakenAtDescCreatedAtDesc(tenantId(), chantierId)
                .stream()
                .filter(row -> matchesZone(row, zone))
                .filter(row -> matchesDate(row, date))
                .map(row -> toDto(row, chantier))
                .toList();
    }

    @Transactional
    public PhotoChantierDto createFromMetadata(String chantierId, PhotoChantierCreateDto body) {
        Chantier chantier = chantierService.getById(chantierId);
        String filename = StringUtils.hasText(body.getFilename()) ? body.getFilename().trim() : "photo.jpg";
        String contentType =
                StringUtils.hasText(body.getContentType()) ? body.getContentType().trim() : "image/jpeg";
        String storagePath = StringUtils.hasText(body.getStoragePath())
                ? body.getStoragePath().trim()
                : buildStoragePath(chantierId, filename);
        String photoId = "photo-" + UUID.randomUUID();
        PhotoChantier entity = PhotoChantier.builder()
                .id(photoId)
                .tenantId(tenantId())
                .chantierId(chantierId)
                .filename(filename)
                .contentType(contentType)
                .storagePath(storagePath)
                .lat(body.getLat())
                .lng(body.getLng())
                .zone(StringUtils.hasText(body.getZone()) ? body.getZone().trim() : null)
                .takenAt(body.getTakenAt())
                .exifJson(body.getExifJson())
                .uploadedBy(body.getUploadedBy().trim())
                .build();
        return toDto(repository.save(entity), chantier);
    }

    @Transactional
    public PhotoChantierDto createFromMultipart(
            String chantierId,
            MultipartFile file,
            Double lat,
            Double lng,
            String zone,
            OffsetDateTime takenAt,
            String exifJson,
            String uploadedBy)
            throws java.io.IOException {
        Chantier chantier = chantierService.getById(chantierId);
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is required");
        }
        String filename = file.getOriginalFilename();
        if (!StringUtils.hasText(filename)) {
            filename = "upload-" + UUID.randomUUID() + ".jpg";
        } else {
            filename = filename.trim();
        }
        String contentType = StringUtils.hasText(file.getContentType()) ? file.getContentType() : "image/jpeg";
        String photoId = "photo-" + UUID.randomUUID();
        RecordAttachment attachment = attachmentService.attach(ATTACHMENT_ENTITY_TYPE, photoId, file);
        PhotoChantier entity = PhotoChantier.builder()
                .id(photoId)
                .tenantId(tenantId())
                .chantierId(chantierId)
                .filename(filename)
                .contentType(contentType)
                .storagePath(attachment.getFileUrl())
                .lat(lat)
                .lng(lng)
                .zone(StringUtils.hasText(zone) ? zone.trim() : null)
                .takenAt(takenAt != null ? takenAt : OffsetDateTime.now())
                .exifJson(exifJson)
                .uploadedBy(StringUtils.hasText(uploadedBy) ? uploadedBy.trim() : "system")
                .build();
        return toDto(repository.save(entity), chantier);
    }

    @Transactional
    public void delete(String id) {
        PhotoChantier entity = getEntity(id);
        deleteStoredFile(entity.getStoragePath());
        repository.delete(entity);
    }

    @Transactional(readOnly = true)
    public PhotoChantierUrlDto getContentUrl(String id) {
        seedService.seedIfEmpty();
        PhotoChantier entity = getEntity(id);
        return PhotoChantierUrlDto.builder()
                .id(entity.getId())
                .url(resolveDownloadUrl(entity.getStoragePath()))
                .storagePath(entity.getStoragePath())
                .build();
    }

    private PhotoChantier getEntity(String id) {
        return repository
                .findById(id)
                .filter(row -> row.getTenantId().equals(tenantId()))
                .orElseThrow(() -> new IllegalArgumentException("Photo not found: " + id));
    }

    private boolean matchesZone(PhotoChantier row, String zone) {
        if (!StringUtils.hasText(zone)) {
            return true;
        }
        return row.getZone() != null && row.getZone().equalsIgnoreCase(zone.trim());
    }

    private boolean matchesDate(PhotoChantier row, LocalDate date) {
        if (date == null) {
            return true;
        }
        LocalDate takenDate = row.getTakenAt().atZoneSameInstant(ZoneOffset.UTC).toLocalDate();
        return takenDate.equals(date);
    }

    private PhotoChantierDto toDto(PhotoChantier row, Chantier chantier) {
        return PhotoChantierDto.builder()
                .id(row.getId())
                .chantierId(row.getChantierId())
                .chantierCode(chantier.getCode())
                .filename(row.getFilename())
                .contentType(row.getContentType())
                .storagePath(row.getStoragePath())
                .lat(row.getLat())
                .lng(row.getLng())
                .zone(row.getZone())
                .takenAt(row.getTakenAt())
                .exifJson(row.getExifJson())
                .uploadedBy(row.getUploadedBy())
                .createdAt(row.getCreatedAt())
                .contentUrl("/api/v1/photos/" + row.getId() + "/content")
                .build();
    }

    private String resolveDownloadUrl(String storagePath) {
        if (!StringUtils.hasText(storagePath)) {
            return "";
        }
        if (storagePath.startsWith("photos/") || storagePath.contains("#size=")) {
            return "/api/v1/photos/" + storagePath;
        }
        String downloadUrl = fileStorage.getDownloadUrl(storagePath);
        if (StringUtils.hasText(downloadUrl) && downloadUrl.startsWith("http")) {
            return downloadUrl;
        }
        return "/api/v1/platform/collaboration/attachments/download?key="
                + java.net.URLEncoder.encode(storagePath, java.nio.charset.StandardCharsets.UTF_8);
    }

    private void deleteStoredFile(String storagePath) {
        if (!StringUtils.hasText(storagePath) || storagePath.startsWith("photos/") || storagePath.contains("#size=")) {
            return;
        }
        fileStorage.delete(storagePath);
    }

    private static String buildStoragePath(String chantierId, String filename) {
        return "photos/" + chantierId + "/" + filename;
    }

    private UUID tenantId() {
        return TenantContext.getTenantId();
    }
}
