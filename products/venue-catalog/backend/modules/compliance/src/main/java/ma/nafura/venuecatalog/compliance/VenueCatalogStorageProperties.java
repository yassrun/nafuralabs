package ma.nafura.venuecatalog.compliance;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "nafura.storage")
public class VenueCatalogStorageProperties {

    private String bucket = "venue-catalog-media";
    private int publicReadSignedUrlTtlMinutes = 60;

    public String getBucket() {
        return bucket;
    }

    public void setBucket(String bucket) {
        this.bucket = bucket;
    }

    public int getPublicReadSignedUrlTtlMinutes() {
        return publicReadSignedUrlTtlMinutes;
    }

    public void setPublicReadSignedUrlTtlMinutes(int publicReadSignedUrlTtlMinutes) {
        this.publicReadSignedUrlTtlMinutes = publicReadSignedUrlTtlMinutes;
    }
}
