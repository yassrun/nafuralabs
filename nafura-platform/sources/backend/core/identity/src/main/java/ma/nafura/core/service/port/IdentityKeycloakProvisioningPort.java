package ma.nafura.platform.identity.service.port;

/**
 * Outbound port for Keycloak user provisioning during invitation acceptance.
 * Implemented by the product application.
 */
public interface IdentityKeycloakProvisioningPort {

    boolean isEnabled();

    boolean userExists(String email);

    void provisionInvitedUser(String email, String password, String firstName, String lastName);

    void deleteUserIfExists(String email);
}
