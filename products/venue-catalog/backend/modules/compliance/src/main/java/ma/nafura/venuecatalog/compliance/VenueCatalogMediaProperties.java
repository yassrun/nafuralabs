package ma.nafura.venuecatalog.compliance;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "venue-catalog.media")
public class VenueCatalogMediaProperties {

    private int maxPhotosPerPlace = 5;
    private int fetchMaxWidthPx = 1600;
    private int cacheTtlDays = 30;

    public int getMaxPhotosPerPlace() {
        return maxPhotosPerPlace;
    }

    public void setMaxPhotosPerPlace(int maxPhotosPerPlace) {
        this.maxPhotosPerPlace = maxPhotosPerPlace;
    }

    public int getFetchMaxWidthPx() {
        return fetchMaxWidthPx;
    }

    public void setFetchMaxWidthPx(int fetchMaxWidthPx) {
        this.fetchMaxWidthPx = fetchMaxWidthPx;
    }

    public int getCacheTtlDays() {
        return cacheTtlDays;
    }

    public void setCacheTtlDays(int cacheTtlDays) {
        this.cacheTtlDays = cacheTtlDays;
    }
}
