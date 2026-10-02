package ma.nafura.platform.identity.service.port;

/** Fallback registered by {@code NafuraIdentityAutoConfiguration} when no Keycloak adapter exists. */
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
