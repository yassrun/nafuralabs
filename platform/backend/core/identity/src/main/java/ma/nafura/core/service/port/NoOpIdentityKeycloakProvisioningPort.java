package ma.nafura.platform.identity.service.port;

import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnMissingBean(IdentityKeycloakProvisioningPort.class)
public class NoOpIdentityKeycloakProvisioningPort implements IdentityKeycloakProvisioningPort {

    @Override
    public boolean isEnabled() {
        return false;
    }

    @Override
    public boolean userExists(String email) {
        return false;
    }

    @Override
    public void provisionInvitedUser(String email, String password, String firstName, String lastName) {
        // Dev / no Keycloak: accept without IdP provisioning
    }

    @Override
    public void deleteUserIfExists(String email) {
        // no-op
    }
}
