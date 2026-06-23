package ma.nafura.erp.onboarding.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "nafura.onboarding")
public class OnboardingProperties {

    /** Master feature flag for onboarding v2 (signup + agent flow). */
    private boolean v2Enabled = false;

    /** Allow self-service signup (dev: local user; prod: requires Keycloak admin URL). */
    private boolean signupEnabled = true;

    /** When true, signup skips email verification and Keycloak (local unit tests only). */
    private boolean devSignupBypass = false;

    /** When true (default), self-service signup provisions Keycloak users (prod-like). */
    private boolean keycloakProvisioningEnabled = true;

    private String keycloakAdminUrl = "";
    private String keycloakAdminUsername = "";
    private String keycloakAdminPassword = "";
    private String keycloakRealm = "iam-portal";
    private String keycloakClientId = "nafura-frontend";
    private String applicationId = "erp";

    private String demoProspectEmail = "prospect@nafura-demo.local";

    /** Onboarding JWT lifetime (hours) until user finishes setup or switches to Keycloak. */
    private long accessTokenExpiryHours = 8;
}
