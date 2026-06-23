package ma.nafura.venuecatalog.compliance;

import ma.nafura.platform.integrations.googleplaces.PlaceDetails;
import ma.nafura.platform.integrations.googleplaces.PlacePhotoRef;
import ma.nafura.venuecatalog.place.adapter.persistence.CatalogPlaceMediaEntity;
import ma.nafura.venuecatalog.place.application.CatalogPlaceService;
import ma.nafura.venuecatalog.place.domain.MediaSource;
import ma.nafura.venuecatalog.place.domain.MediaStatus;
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

    private final MediaComplianceService complianceService;
    private final VenueCatalogMediaStorageService storageService;
    private final CatalogPlaceService catalogPlaceService;
    private final VenueCatalogMediaProperties mediaProperties;

    public MediaSyncService(
            MediaComplianceService complianceService,
            VenueCatalogMediaStorageService storageService,
            CatalogPlaceService catalogPlaceService,
            VenueCatalogMediaProperties mediaProperties
    ) {
        this.complianceService = complianceService;
        this.storageService = storageService;
        this.catalogPlaceService = catalogPlaceService;
        this.mediaProperties = mediaProperties;
    }

    public int syncPlaceMedia(UUID catalogPlaceId, PlaceDetails details, PhotoFetcher photoFetcher) {
        if (details.photos() == null || details.photos().isEmpty()) {
            return 0;
        }
        int synced = 0;
        List<PlacePhotoRef> photos = details.photos().stream()
                .limit(mediaProperties.getMaxPhotosPerPlace())
                .toList();
        short order = 0;
        for (PlacePhotoRef photo : photos) {
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

    @FunctionalInterface
    public interface PhotoFetcher {
        byte[] fetch(String photoResourceName, int maxWidthPx);
    }
}
