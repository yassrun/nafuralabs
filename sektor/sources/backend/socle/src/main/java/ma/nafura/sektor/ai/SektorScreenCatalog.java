package ma.nafura.sektor.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

/**
 * Screen catalog generated from {@code erp-sidebar.config.ts} + Anatomy listing create routes.
 */
@Component
public class SektorScreenCatalog {

    public static final String RESOURCE = "ai/screen-catalog.json";

    private final ScreenCatalogDocument document;

    public SektorScreenCatalog(ObjectMapper objectMapper) {
        this.document = load(objectMapper);
    }

    public List<ScreenCatalogEntry> screens() {
        return document.getScreens() != null ? document.getScreens() : List.of();
    }

    public String sourceHash() {
        return document.getSourceHash();
    }

    private static ScreenCatalogDocument load(ObjectMapper objectMapper) {
        ClassPathResource resource = new ClassPathResource(RESOURCE);
        if (!resource.exists()) {
            throw new IllegalStateException("Missing classpath:" + RESOURCE + " — run npm run ai:catalog");
        }
        try (InputStream in = resource.getInputStream()) {
            ScreenCatalogDocument parsed = objectMapper.readValue(in, ScreenCatalogDocument.class);
            if (parsed.getScreens() == null || parsed.getScreens().isEmpty()) {
                throw new IllegalStateException("AI screen catalog is empty — run npm run ai:catalog");
            }
            return parsed;
        } catch (IOException ex) {
            throw new IllegalStateException("Cannot read " + RESOURCE, ex);
        }
    }
}
