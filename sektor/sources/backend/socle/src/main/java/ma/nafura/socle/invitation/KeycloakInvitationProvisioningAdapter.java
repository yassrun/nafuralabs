package ma.nafura.socle.invitation;

import lombok.RequiredArgsConstructor;
import ma.nafura.socle.onboarding.api.dto.OnboardingDtos.SignupRequest;
import ma.nafura.socle.onboarding.service.OnboardingKeycloakProvisioningService;
import ma.nafura.platform.identity.service.port.IdentityKeycloakProvisioningPort;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class KeycloakInvitationProvisioningAdapter implements IdentityKeycloakProvisioningPort {

    private final OnboardingKeycloakProvisioningService keycloakProvisioningService;

    @Override
    public boolean isEnabled() {
        return keycloakProvisioningService.isProvisioningRequired();
    }

    @Override
    public boolean userExists(String email) {
        return keycloakProvisioningService.userExists(email);
    }

    @Override
    public void provisionInvitedUser(String email, String password, String firstName, String lastName) {
        SignupRequest request = new SignupRequest(email, password, firstName, lastName, "fr");
        keycloakProvisioningService.provisionSignupUser(request, true);
    }

    @Override
    public void deleteUserIfExists(String email) {
        keycloakProvisioningService.deleteUserIfExists(email);
    }
}
