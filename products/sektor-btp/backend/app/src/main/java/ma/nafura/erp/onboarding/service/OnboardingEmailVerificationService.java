package ma.nafura.erp.onboarding.service;

import java.util.Locale;
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
public class OnboardingEmailVerificationService {

    public static final String STATUS_PENDING_EMAIL = "PENDING_EMAIL_VERIFICATION";
    public static final String STATUS_ACTIVE = "ACTIVE";

    private final OnboardingProperties properties;
    private final AppUserRepository appUserRepository;
    private final UserOnboardingStateRepository onboardingStateRepository;
    private final OnboardingEmailVerificationTokenService tokenService;
    private final OnboardingSignupEmailService signupEmailService;
    private final OnboardingAccessTokenService accessTokenService;
    private final OnboardingKeycloakProvisioningService keycloakProvisioningService;
    private final SignupIntentService signupIntentService;
    private final JwtDecoder jwtDecoder;

    public boolean isVerificationEnabled() {
        return !properties.isDevSignupBypass();
    }

    public void sendVerificationForIntent(SignupIntent intent) {
        if (!isVerificationEnabled()) {
            return;
        }
        String token = tokenService.generateIntentToken(intent.getId(), intent.getEmail());
        String displayName = (intent.getFirstName() + " " + intent.getLastName()).trim();
        signupEmailService.sendVerificationEmail(intent.getEmail(), displayName, token);
    }

    /** Legacy resend for app_user rows in PENDING_EMAIL_VERIFICATION (pre signup_intent). */
    public void sendVerificationForLegacyPendingUser(AppUser user) {
        if (!isVerificationEnabled()) {
            return;
        }
        String token = tokenService.generateUserToken(user.getId(), user.getEmail());
        signupEmailService.sendVerificationEmail(user.getEmail(), user.getName(), token);
    }

  /**
   * Resend signup verification email for a pending signup_intent or legacy PENDING_EMAIL user.
   * Always returns the same message when verification is enabled (avoids email enumeration).
   */
    public void resendVerificationEmail(String rawEmail) {
        if (!isVerificationEnabled()) {
            throw new IllegalStateException("Email verification is disabled in dev-signup-bypass mode");
        }
        String email = rawEmail.trim().toLowerCase(Locale.ROOT);
        var pendingIntent = signupIntentService.findIntent(email);
        if (pendingIntent.isPresent()) {
            SignupIntent refreshed = signupIntentService.refreshIntentExpiry(pendingIntent.get());
            sendVerificationForIntent(refreshed);
            log.info("Signup verification email resent for intent id={} email={}", refreshed.getId(), email);
            return;
        }
        appUserRepository.findByEmailIgnoreCase(email)
            .filter(user -> STATUS_PENDING_EMAIL.equalsIgnoreCase(user.getStatus()))
            .ifPresent(user -> {
                sendVerificationForLegacyPendingUser(user);
                log.info("Signup verification email resent for legacy pending user id={} email={}", user.getId(), email);
            });
    }

    @Transactional
    public SignupResponse verifyEmail(String rawToken) {
        if (!isVerificationEnabled()) {
            throw new IllegalStateException("Email verification is disabled in dev-signup-bypass mode");
        }
        OnboardingEmailVerificationTokenService.VerificationPayload payload =
            tokenService.validateToken(rawToken.trim());
        if (payload.intentId() != null) {
            return materializeFromIntent(payload);
        }
        return verifyLegacyPendingUser(payload);
    }

    private SignupResponse materializeFromIntent(OnboardingEmailVerificationTokenService.VerificationPayload payload) {
        SignupIntent intent = signupIntentService.requireValidIntent(payload.intentId(), payload.email());
        if (appUserRepository.findByEmailIgnoreCase(intent.getEmail()).isPresent()) {
            signupIntentService.deleteIntent(intent);
            throw new IllegalArgumentException("EMAIL_ALREADY_REGISTERED");
        }
        if (keycloakProvisioningService.isProvisioningRequired()
            && keycloakProvisioningService.userExists(intent.getEmail())) {
            throw new IllegalArgumentException("EMAIL_ALREADY_REGISTERED");
        }

        SignupRequest request = signupIntentService.toSignupRequest(intent);
        String fullName = (request.firstName() + " " + request.lastName()).trim();
        boolean keycloakProvisioned = false;
        try {
            AppUser user = appUserRepository.save(AppUser.builder()
                .email(intent.getEmail())
                .name(fullName)
                .status(STATUS_ACTIVE)
                .build());
            ensureOnboardingState(user.getId());

            if (keycloakProvisioningService.isProvisioningRequired()) {
                keycloakProvisioningService.provisionSignupUser(request, true);
                keycloakProvisioned = true;
            }

            signupIntentService.deleteIntent(intent);
            log.info("Signup intent materialized app_user id={} email={}", user.getId(), user.getEmail());
            return issueTokens(user, "Email confirmé. Poursuivez la configuration.");
        } catch (RuntimeException ex) {
            if (keycloakProvisioned) {
                keycloakProvisioningService.deleteUserIfExists(intent.getEmail());
            }
            throw ex;
        }
    }

    /** Legacy path for app_user rows created before signup_intent rollout. */
    private SignupResponse verifyLegacyPendingUser(
        OnboardingEmailVerificationTokenService.VerificationPayload payload
    ) {
        AppUser user = appUserRepository.findById(payload.userId())
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (!user.getEmail().equalsIgnoreCase(payload.email())) {
            throw new IllegalArgumentException("INVALID_VERIFICATION_TOKEN");
        }
        if (!STATUS_PENDING_EMAIL.equalsIgnoreCase(user.getStatus())) {
            if (STATUS_ACTIVE.equalsIgnoreCase(user.getStatus())) {
                return issueTokens(user, "Compte déjà activé. Vous pouvez vous connecter.");
            }
            throw new IllegalArgumentException("INVALID_VERIFICATION_STATE");
        }
        user.setStatus(STATUS_ACTIVE);
        appUserRepository.save(user);
        keycloakProvisioningService.markEmailVerified(user.getEmail());
        log.info("Legacy email verified for app_user id={} email={}", user.getId(), user.getEmail());
        return issueTokens(user, "Email confirmé. Poursuivez la configuration.");
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

    private SignupResponse issueTokens(AppUser user, String message) {
        OnboardingAccessTokenService.IssuedToken issued = accessTokenService.issue(user.getId(), user.getEmail());
        jwtDecoder.decode(issued.accessToken());
        return new SignupResponse(
            user.getId().toString(),
            user.getEmail().toLowerCase(Locale.ROOT),
            message,
            false,
            issued.accessToken(),
            issued.expiresInSeconds(),
            false,
            false
        );
    }
}
