package ma.nafura.venuecatalog.compliance;

import ma.nafura.venuecatalog.place.adapter.persistence.CatalogPlaceMediaRepository;
import ma.nafura.venuecatalog.place.domain.MediaStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;

@Component
public class MediaRetentionScheduler {

    private static final Logger log = LoggerFactory.getLogger(MediaRetentionScheduler.class);

    private final CatalogPlaceMediaRepository mediaRepository;
    private final VenueCatalogMediaStorageService storageService;

    public MediaRetentionScheduler(
            CatalogPlaceMediaRepository mediaRepository,
            VenueCatalogMediaStorageService storageService
    ) {
        this.mediaRepository = mediaRepository;
        this.storageService = storageService;
    }

    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public void purgeExpiredMedia() {
        OffsetDateTime now = OffsetDateTime.now();
        mediaRepository.findAll().stream()
                .filter(media -> media.getStatus() == MediaStatus.ACTIVE && media.getExpiresAt().isBefore(now))
                .forEach(media -> {
                    try {
                        storageService.delete(media.getStorageKey());
                    } catch (Exception ex) {
                        log.warn("Failed to purge media {} from storage", media.getId(), ex);
                    }
                    media.setStatus(MediaStatus.PURGED);
                    mediaRepository.save(media);
                });
    }
}
