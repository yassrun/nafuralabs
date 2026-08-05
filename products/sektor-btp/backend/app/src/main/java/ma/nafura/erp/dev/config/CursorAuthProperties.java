package ma.nafura.erp.dev.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "nafura.dev")
public class CursorAuthProperties {

    /** Local Mode B only — never enable on staging/prod pods. */
    private boolean cursorAuthEnabled = false;

    private String cursorAuthEmail = "cursor.qa@nafuralabs.local";

    /** Optional override; empty → first ACTIVE membership for the cursor user. */
    private String cursorAuthTenantId = "";
}
