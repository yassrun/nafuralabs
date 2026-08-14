package ma.nafura.socle.dev.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "nafura.dev")
public class CursorAuthProperties {

    /** Local Mode B only — never enable on staging/prod pods. */
    private boolean cursorAuthEnabled = false;

    /** Default QA owner — see {@link QaLocalConstants#OWNER_EMAIL}. */
    private String cursorAuthEmail = QaLocalConstants.OWNER_EMAIL;

    /** Optional override; empty → first ACTIVE membership for the cursor user. */
    private String cursorAuthTenantId = "";
}
