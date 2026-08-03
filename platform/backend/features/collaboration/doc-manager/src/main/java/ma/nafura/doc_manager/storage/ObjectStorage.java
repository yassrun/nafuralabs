package ma.nafura.platform.collaboration.docmanager.storage;

import java.time.Duration;
import java.util.Map;

/**
 * Product-neutral object storage port for media that is not a managed document.
 */
public interface ObjectStorage {

    void ensureBucket(String bucket);

    void put(
            String bucket,
            String key,
            byte[] content,
            String contentType,
            Map<String, String> metadata
    );

    void delete(String bucket, String key);

    boolean exists(String bucket, String key);

    String presignGet(String bucket, String key, Duration ttl);
}
