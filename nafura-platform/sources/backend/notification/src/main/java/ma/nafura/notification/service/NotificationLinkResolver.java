package ma.nafura.platform.collaboration.notification.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Turns relative notification {@code actionUrl} values into absolute links using the product web origin
 * ({@code app.frontend-base-url}, set from {@code app.nafura.json} {@code spec.local.ports.web} in lab).
 */
@Component
public class NotificationLinkResolver {

    private final String frontendBaseUrl;

    public NotificationLinkResolver(
            @Value("${app.frontend-base-url:}") String frontendBaseUrl) {
        this.frontendBaseUrl = frontendBaseUrl == null ? "" : frontendBaseUrl.trim().replaceAll("/+$", "");
    }

    public String absolute(String actionUrl) {
        if (actionUrl == null || actionUrl.isBlank()) {
            return null;
        }
        String url = actionUrl.trim();
        if (url.startsWith("http://") || url.startsWith("https://")) {
            return url;
        }
        if (frontendBaseUrl.isEmpty()) {
            return url;
        }
        return url.startsWith("/") ? frontendBaseUrl + url : frontendBaseUrl + "/" + url;
    }

    public String baseUrl() {
        return frontendBaseUrl;
    }
}
