package ma.nafura.erp.onboarding.api;

import jakarta.validation.Valid;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.nafura.erp.onboarding.api.dto.OnboardingDtos;
import ma.nafura.erp.onboarding.config.OnboardingProperties;
import ma.nafura.erp.onboarding.service.OnboardingAgentParserService;
import ma.nafura.erp.onboarding.service.OnboardingBulkInviteService;
import ma.nafura.erp.onboarding.service.OnboardingCompletenessService;
import ma.nafura.erp.onboarding.service.OnboardingEmailVerificationService;
import ma.nafura.erp.onboarding.service.OnboardingSignupService;
import ma.nafura.erp.onboarding.service.OnboardingStateService;
import ma.nafura.erp.onboarding.service.TenantPresetOrchestratorService;
import ma.nafura.erp.onboarding.service.TenantProvisioningService;
import ma.nafura.platform.authorization.security.authorization.PublicEndpoint;
import ma.nafura.platform.identity.domain.model.AppUser;
import ma.nafura.platform.identity.repository.AppUserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequiredArgsConstructor
public class OnboardingController {

    private final OnboardingProperties properties;
    private final OnboardingSignupService signupService;
    private final OnboardingEmailVerificationService emailVerificationService;
    private final TenantProvisioningService tenantProvisioningService;
    private final TenantPresetOrchestratorService presetOrchestratorService;
    private final OnboardingStateService stateService;
    private final OnboardingCompletenessService completenessService;
    private final OnboardingBulkInviteService bulkInviteService;
    private final OnboardingAgentParserService agentParserService;
    private final AppUserRepository appUserRepository;

    @PostMapping("/api/public/onboarding/signup")
    @PublicEndpoint(reason = "Self-service ERP onboarding signup")
    public ResponseEntity<OnboardingDtos.SignupResponse> signup(@Valid @RequestBody OnboardingDtos.SignupRequest request) {
        if (!properties.isV2Enabled()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(signupService.signup(request));
    }

    @PostMapping("/api/public/onboarding/verify-email")
    @PublicEndpoint(reason = "Confirm signup email and issue session token")
    public ResponseEntity<OnboardingDtos.SignupResponse> verifyEmail(
        @Valid @RequestBody OnboardingDtos.VerifyEmailRequest request
    ) {
        if (!properties.isV2Enabled()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        return ResponseEntity.ok(emailVerificationService.verifyEmail(request.token()));
    }

    @PostMapping("/api/public/onboarding/resend-verification-email")
    @PublicEndpoint(reason = "Resend signup confirmation email for pending registration")
    public ResponseEntity<OnboardingDtos.ResendVerificationEmailResponse> resendVerificationEmail(
        @Valid @RequestBody OnboardingDtos.ResendVerificationEmailRequest request
    ) {
        if (!properties.isV2Enabled()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        String email = request.email().trim().toLowerCase();
        emailVerificationService.resendVerificationEmail(email);
        return ResponseEntity.ok(new OnboardingDtos.ResendVerificationEmailResponse(
            email,
            "Si une inscription est en attente pour cette adresse, un nouvel email de confirmation a été envoyé."
        ));
    }

    @GetMapping("/api/onboarding/state")
    public ResponseEntity<OnboardingDtos.OnboardingStateResponse> getState(@AuthenticationPrincipal Jwt jwt) {
        requireEnabled();
        UUID userId = resolveUserId(jwt);
        return ResponseEntity.ok(stateService.getState(userId));
    }

    @PutMapping("/api/onboarding/state")
    public ResponseEntity<OnboardingDtos.OnboardingStateResponse> saveState(
        @AuthenticationPrincipal Jwt jwt,
        @Valid @RequestBody OnboardingDtos.SaveOnboardingStateRequest request
    ) {
        requireEnabled();
        UUID userId = resolveUserId(jwt);
        return ResponseEntity.ok(stateService.saveState(userId, request));
    }

    @PostMapping("/api/tenants")
    public ResponseEntity<OnboardingDtos.CreateTenantResponse> createTenant(
        @AuthenticationPrincipal Jwt jwt,
        @Valid @RequestBody OnboardingDtos.CreateTenantRequest request
    ) {
        requireEnabled();
        UUID userId = resolveUserId(jwt);
        OnboardingDtos.CreateTenantResponse response = tenantProvisioningService.createTenant(userId, request);
        stateService.linkTenant(userId, UUID.fromString(response.tenantId()));
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/api/tenants/{tenantId}/apply-preset")
    public ResponseEntity<OnboardingDtos.ApplyPresetResponse> applyPreset(
        @AuthenticationPrincipal Jwt jwt,
        @PathVariable UUID tenantId,
        @Valid @RequestBody OnboardingDtos.ApplyPresetRequest request
    ) {
        requireEnabled();
        UUID userId = resolveUserId(jwt);
        tenantProvisioningService.assertOwnerMembership(tenantId, userId);
        return ResponseEntity.ok(presetOrchestratorService.applyPreset(tenantId, request));
    }

    @GetMapping("/api/tenants/{tenantId}/completeness")
    public ResponseEntity<OnboardingDtos.CompletenessResponse> completeness(
        @AuthenticationPrincipal Jwt jwt,
        @PathVariable UUID tenantId
    ) {
        requireEnabled();
        UUID userId = resolveUserId(jwt);
        tenantProvisioningService.assertOwnerMembership(tenantId, userId);
        return ResponseEntity.ok(completenessService.compute(tenantId));
    }

    @PostMapping("/api/tenants/{tenantId}/members/bulk-invite")
    public ResponseEntity<OnboardingDtos.BulkInviteResponse> bulkInvite(
        @AuthenticationPrincipal Jwt jwt,
        @PathVariable UUID tenantId,
        @Valid @RequestBody OnboardingDtos.BulkInviteRequest request
    ) {
        requireEnabled();
        UUID userId = resolveUserId(jwt);
        return ResponseEntity.ok(bulkInviteService.bulkInvite(tenantId, userId, request));
    }

    @PostMapping("/api/onboarding/agent")
    public ResponseEntity<OnboardingDtos.AgentParseResponse> parseAgent(
        @AuthenticationPrincipal Jwt jwt,
        @Valid @RequestBody OnboardingDtos.AgentParseRequest request
    ) {
        requireEnabled();
        resolveUserId(jwt);
        if ("q1".equalsIgnoreCase(request.questionId()) || "1".equals(request.questionId())) {
            return ResponseEntity.ok(agentParserService.parseQuestion1(request.userMessage(), request.context()));
        }
        return ResponseEntity.ok(new OnboardingDtos.AgentParseResponse(Map.of(), null));
    }

    @PostMapping("/api/onboarding/agent/normalize-preset")
    public ResponseEntity<OnboardingDtos.ApplyPresetRequest> normalizePreset(
        @AuthenticationPrincipal Jwt jwt,
        @RequestBody Map<String, Object> answers
    ) {
        requireEnabled();
        resolveUserId(jwt);
        return ResponseEntity.ok(agentParserService.buildPresetFromAnswers(answers));
    }

    private UUID resolveUserId(Jwt jwt) {
        String email = jwt.getClaimAsString("email");
        AppUser user = appUserRepository.findByEmailIgnoreCase(email)
            .orElseThrow(() -> new IllegalArgumentException("User not provisioned"));
        return user.getId();
    }

    private void requireEnabled() {
        if (!properties.isV2Enabled()) {
            throw new IllegalStateException("Onboarding v2 is disabled");
        }
    }
}
