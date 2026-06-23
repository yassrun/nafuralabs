package ma.nafura.erp.onboarding.service;

import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.nafura.erp.onboarding.api.dto.OnboardingDtos.SignupRequest;
import ma.nafura.erp.onboarding.api.dto.OnboardingDtos.SignupResponse;
import ma.nafura.erp.onboarding.config.OnboardingProperties;
import ma.nafura.erp.onboarding.domain.SignupIntent;
import ma.nafura.erp.onboarding.domain.UserOnboardingState;
import ma.nafura.erp.onboarding.repository.UserOnboardingStateRepository;
import ma.nafura.platform.identity.domain.model.AppUser;
import ma.nafura.platform.identity.repository.AppUserRepository;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class OnboardingSignupService {

    private final OnboardingProperties properties;
    private final AppUserRepository appUserRepository;
    private final UserOnboardingStateRepository onboardingStateRepository;
    private final OnboardingAccessTokenService accessTokenService;
    private final JwtDecoder jwtDecoder;
    private final OnboardingEmailVerificationService emailVerificationService;
    private final OnboardingKeycloakProvisioningService keycloakProvisioningService;
    private final SignupIntentService signupIntentService;

    @Transactional
    public SignupResponse signup(SignupRequest request) {
        if (!properties.isV2Enabled() || !properties.isSignupEnabled()) {
            throw new IllegalStateException("Self-service signup is disabled");
        }

        String email = request.email().trim().toLowerCase(Locale.ROOT);
        Optional<AppUser> existing = appUserRepository.findByEmailIgnoreCase(email);
        if (existing.isPresent()) {
            return handleExistingUser(existing.get(), request, email);
        }

        if (emailVerificationService.isVerificationEnabled()) {
            return createDeferredSignup(request, email);
        }
        return createImmediateSignup(request, email);
    }

    private SignupResponse createDeferredSignup(SignupRequest request, String email) {
        if (keycloakProvisioningService.isProvisioningRequired()
            && keycloakProvisioningService.userExists(email)) {
            throw new IllegalArgumentException("EMAIL_ALREADY_REGISTERED");
        }

        SignupIntent intent = signupIntentService.upsertIntent(request);
        emailVerificationService.sendVerificationForIntent(intent);
        log.info("Onboarding signup intent stored id={} email={}", intent.getId(), email);
        return buildSignupResponse(null, email, false, true, null, 0L, false);
    }

    private SignupResponse createImmediateSignup(SignupRequest request, String email) {
        String fullName = (request.firstName() + " " + request.lastName()).trim();
        boolean keycloakProvisioned = false;
        try {
            AppUser user = appUserRepository.save(AppUser.builder()
                .email(email)
                .name(fullName)
                .status(OnboardingEmailVerificationService.STATUS_ACTIVE)
                .build());
            ensureOnboardingState(user.getId());

            if (keycloakProvisioningService.isProvisioningRequired()) {
                keycloakProvisioningService.provisionSignupUser(request, true);
                keycloakProvisioned = true;
            }

            log.info("Onboarding signup created app_user id={} email={}", user.getId(), email);
            OnboardingAccessTokenService.IssuedToken issued = issueAccessToken(user);
            return buildSignupResponse(user, email, false, false, issued.accessToken(), issued.expiresInSeconds(), false);
        } catch (RuntimeException ex) {
            if (keycloakProvisioned) {
                keycloakProvisioningService.deleteUserIfExists(email);
            }
            throw ex;
        }
    }

    private SignupResponse handleExistingUser(AppUser user, SignupRequest request, String email) {
        if (OnboardingEmailVerificationService.STATUS_PENDING_EMAIL.equalsIgnoreCase(user.getStatus())) {
            return handleLegacyPendingUser(user, request, email);
        }

        if (isOnboardingIncomplete(user.getId())) {
            updateUserName(user, request.firstName(), request.lastName());
            log.info("Onboarding signup resume app_user id={} email={}", user.getId(), email);
            OnboardingAccessTokenService.IssuedToken issued = issueAccessToken(user);
            return buildSignupResponse(
                user,
                email,
                true,
                false,
                issued.accessToken(),
                issued.expiresInSeconds(),
                false
            );
        }

        if (keycloakProvisioningService.isProvisioningRequired()
            && !keycloakProvisioningService.userExists(email)) {
            updateUserName(user, request.firstName(), request.lastName());
            keycloakProvisioningService.provisionSignupUser(request, true);
            log.warn(
                "Keycloak user re-provisioned for existing app_user id={} email={} (identity store was reset)",
                user.getId(),
                email
            );
            return buildSignupResponse(
                user,
                email,
                false,
                false,
                null,
                0L,
                true
            );
        }
        throw new IllegalArgumentException("EMAIL_ALREADY_REGISTERED");
    }

    /** Legacy pending app_user rows (pre signup_intent). */
    private SignupResponse handleLegacyPendingUser(AppUser user, SignupRequest request, String email) {
        updateUserName(user, request.firstName(), request.lastName());
        if (keycloakProvisioningService.isProvisioningRequired()) {
            keycloakProvisioningService.provisionSignupUser(request, false);
        }
        emailVerificationService.sendVerificationForLegacyPendingUser(user);
        return buildSignupResponse(user, email, false, true, null, 0L, false);
    }

    private void ensureOnboardingState(UUID userId) {
        onboardingStateRepository.findByUserId(userId).orElseGet(() ->
            onboardingStateRepository.save(UserOnboardingState.builder()
                .userId(userId)
                .currentStep(0)
                .answersJson("{}")
                .build())
        );
    }

    private void updateUserName(AppUser user, String firstName, String lastName) {
        String fullName = (firstName + " " + lastName).trim();
        if (!fullName.isBlank() && !fullName.equals(user.getName())) {
            user.setName(fullName);
            appUserRepository.save(user);
        }
    }

    private boolean isOnboardingIncomplete(UUID userId) {
        return onboardingStateRepository.findByUserId(userId)
            .map(state -> state.getCompletedAt() == null && state.getCurrentStep() < 5)
            .orElse(true);
    }

    private OnboardingAccessTokenService.IssuedToken issueAccessToken(AppUser user) {
        OnboardingAccessTokenService.IssuedToken issued = accessTokenService.issue(user.getId(), user.getEmail());
        jwtDecoder.decode(issued.accessToken());
        log.debug("Onboarding access token round-trip OK for user {}", user.getId());
        return issued;
    }

    private SignupResponse buildSignupResponse(
        AppUser user,
        String email,
        boolean resumed,
        boolean verificationRequired,
        String accessToken,
        long expiresIn,
        boolean loginRequired
    ) {
        String message;
        if (loginRequired) {
            message = "Identité restaurée. Connectez-vous avec votre email et mot de passe.";
        } else if (verificationRequired) {
            message = resumed
                ? "Un nouvel email de confirmation a été envoyé."
                : "Vérifiez votre boîte mail pour activer votre compte.";
        } else if (resumed) {
            message = "Configuration reprise. Poursuivez où vous vous êtes arrêté.";
        } else {
            message = "Compte créé. Poursuivez la configuration.";
        }
        return new SignupResponse(
            user != null ? user.getId().toString() : null,
            email,
            message,
            verificationRequired,
            accessToken,
            expiresIn,
            resumed,
            loginRequired
        );
    }

    public UUID resolveUserIdByEmail(String email) {
        return appUserRepository.findByEmailIgnoreCase(email.trim().toLowerCase(Locale.ROOT))
            .map(AppUser::getId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }
}
