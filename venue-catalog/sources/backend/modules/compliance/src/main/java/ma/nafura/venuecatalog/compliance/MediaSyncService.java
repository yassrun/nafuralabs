package ma.nafura.venuecatalog.compliance;

import ma.nafura.platform.integrations.googleplaces.PlaceDetails;
import ma.nafura.platform.integrations.googleplaces.PlacePhotoRef;
import ma.nafura.venuecatalog.place.adapter.persistence.CatalogPlaceMediaEntity;
import ma.nafura.venuecatalog.place.adapter.persistence.CatalogPlaceMediaRepository;
import ma.nafura.venuecatalog.place.application.CatalogPlaceService;
import ma.nafura.venuecatalog.place.domain.MediaSource;
import ma.nafura.venuecatalog.place.domain.MediaStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@Transactional
public class MediaSyncService {

    private static final Logger log = LoggerFactory.getLogger(MediaSyncService.class);

    private final MediaComplianceService complianceService;
    private final VenueCatalogMediaStorageService storageService;
    private final CatalogPlaceService catalogPlaceService;
    private final CatalogPlaceMediaRepository mediaRepository;
    private final VenueCatalogMediaProperties mediaProperties;

    public MediaSyncService(
            MediaComplianceService complianceService,
            VenueCatalogMediaStorageService storageService,
            CatalogPlaceService catalogPlaceService,
            CatalogPlaceMediaRepository mediaRepository,
            VenueCatalogMediaProperties mediaProperties
    ) {
        this.complianceService = complianceService;
        this.storageService = storageService;
        this.catalogPlaceService = catalogPlaceService;
        this.mediaRepository = mediaRepository;
        this.mediaProperties = mediaProperties;
    }

    public int syncPlaceMedia(UUID catalogPlaceId, PlaceDetails details, PhotoFetcher photoFetcher) {
        if (details.photos() == null || details.photos().isEmpty()) {
            return 0;
        }

        long existingCount = mediaRepository.countByCatalogPlaceIdAndStatus(catalogPlaceId, MediaStatus.ACTIVE);
        int max = mediaProperties.getMaxPhotosPerPlace();
        if (existingCount >= max) {
            log.debug("Skip media sync for {}: already {} active photos (max={})", catalogPlaceId, existingCount, max);
            return 0;
        }

        int remaining = max - (int) existingCount;
        int synced = 0;
        List<PlacePhotoRef> photos = details.photos().stream()
                .limit(max)
                .toList();
        short order = (short) existingCount;
        for (PlacePhotoRef photo : photos) {
            if (synced >= remaining) {
                break;
            }
            if (photo.name() != null
                    && mediaRepository.existsByCatalogPlaceIdAndProviderPhotoRef(catalogPlaceId, photo.name())) {
                log.debug("Skip photo {} already stored for {}", photo.name(), catalogPlaceId);
                continue;
            }
            byte[] content = photoFetcher.fetch(photo.name(), mediaProperties.getFetchMaxWidthPx());
            storePhoto(catalogPlaceId, photo, content, order++);
            synced++;
        }
        return synced;
    }

    public void storePhoto(UUID catalogPlaceId, PlacePhotoRef photo, byte[] content, short sortOrder) {
        complianceService.validateGooglePhoto(photo, content);
        Map<String, String> metadata = new HashMap<>();
        metadata.put("source", MediaSource.GOOGLE_PLACES.name());
        metadata.put("provider-photo-ref", photo.name());
        metadata.put("catalog-place-id", catalogPlaceId.toString());
        VenueCatalogMediaStorageService.StoredObject stored =
                storageService.storeGooglePhoto(catalogPlaceId, content, metadata);

        CatalogPlaceMediaEntity media = new CatalogPlaceMediaEntity();
        media.setCatalogPlaceId(catalogPlaceId);
        media.setSource(MediaSource.GOOGLE_PLACES);
        media.setStorageKey(stored.storageKey());
        media.setWidth(photo.widthPx() > 0 ? photo.widthPx() : mediaProperties.getFetchMaxWidthPx());
        media.setHeight(photo.heightPx() > 0 ? photo.heightPx() : 900);
        media.setAttributionText(complianceService.buildAttribution(photo));
        if (photo.authorAttributions() != null && !photo.authorAttributions().isEmpty()) {
            media.setAuthorName(photo.authorAttributions().getFirst());
        }
        media.setReusable(false);
        media.setProviderPhotoRef(photo.name());
        media.setContentChecksum(stored.checksum());
        media.setExpiresAt(OffsetDateTime.now().plusDays(mediaProperties.getCacheTtlDays()));
        media.setSortOrder(sortOrder);
        media.setStatus(MediaStatus.ACTIVE);
        media.setPublicUrl(storageService.signedUrl(stored.storageKey()));
        catalogPlaceService.saveMedia(media);
    }

    public String resolvePublicUrl(CatalogPlaceMediaEntity media) {
        return storageService.signedUrl(media.getStorageKey());
    }

    public void deleteStoredObject(String storageKey) {
        if (storageKey == null || storageKey.isBlank()) {
            return;
        }
        storageService.delete(storageKey);
    }

    @FunctionalInterface
    public interface PhotoFetcher {
        byte[] fetch(String photoResourceName, int maxWidthPx);
    }
}
