package ma.nafura.platform.collaboration.docmanager.template;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

/**
 * Connection settings for the Gotenberg rendering service.
 *
 * <p>The service must stay on the internal network: it converts arbitrary HTML and must never be
 * reachable from outside the cluster.
 */
@Configuration
@ConfigurationProperties(prefix = "nafura.documents.gotenberg")
public class GotenbergProperties {

    /** Base URL of the Gotenberg service, e.g. http://gotenberg:3000 */
    private String url = "http://gotenberg:3000";

    private Duration connectTimeout = Duration.ofSeconds(5);

    private Duration readTimeout = Duration.ofSeconds(30);

    /** Guard against a runaway template producing an unbounded document. */
    private int maxDocumentBytes = 5 * 1024 * 1024;

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public Duration getConnectTimeout() {
        return connectTimeout;
    }

    public void setConnectTimeout(Duration connectTimeout) {
        this.connectTimeout = connectTimeout;
    }

    public Duration getReadTimeout() {
        return readTimeout;
    }

    public void setReadTimeout(Duration readTimeout) {
        this.readTimeout = readTimeout;
    }

    public int getMaxDocumentBytes() {
        return maxDocumentBytes;
    }

    public void setMaxDocumentBytes(int maxDocumentBytes) {
        this.maxDocumentBytes = maxDocumentBytes;
    }
}
