package ma.nafura.platform.administration.iam.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.nafura.platform.administration.iam.api.request.publicapi.AcceptInvitationRequest;
import ma.nafura.platform.administration.iam.api.response.publicapi.InvitationAcceptResponse;
import ma.nafura.platform.administration.iam.api.response.publicapi.InvitationPreviewResponse;
import ma.nafura.platform.administration.iam.domain.model.TenantInvitation;
import ma.nafura.platform.administration.iam.repository.TenantInvitationRepository;
import ma.nafura.platform.administration.iam.service.port.InvitationEmailPort;
import ma.nafura.platform.identity.domain.model.AppUser;
import ma.nafura.platform.identity.repository.AppUserRepository;
import ma.nafura.platform.identity.service.port.IdentityKeycloakProvisioningPort;
import ma.nafura.platform.tenancy.domain.model.Tenant;
import ma.nafura.platform.tenancy.domain.model.TenantMembership;
import ma.nafura.platform.tenancy.repository.TenantMembershipRepository;
import ma.nafura.platform.tenancy.repository.TenantRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.OffsetDateTime;
import java.util.Locale;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class InvitationAcceptService {

    private static final String MEMBER_STATUS_ACTIVE = "ACTIVE";
    private static final String MEMBER_STATUS_INVITED = "INVITED";

    private final InvitationTokenService invitationTokenService;
    private final TenantInvitationRepository tenantInvitationRepository;
    private final TenantMembershipRepository tenantMembershipRepository;
    private final TenantRepository tenantRepository;
    private final AppUserRepository appUserRepository;
    private final IdentityKeycloakProvisioningPort keycloakProvisioningPort;
    private final InvitationEmailPort invitationEmailPort;

    public InvitationPreviewResponse preview(String token) {
        ResolvedInvitation resolved = resolveInvitation(token, false);
        Tenant tenant = resolved.tenant();
        boolean requiresAccountSetup = keycloakProvisioningPort.isEnabled()
            && !keycloakProvisioningPort.userExists(resolved.tokenPayload().email());
        boolean alreadyAccepted = MEMBER_STATUS_ACTIVE.equalsIgnoreCase(resolved.membership().getStatus());

        return new InvitationPreviewResponse(
            tenant.getId().toString(),
            tenant.getKey(),
            tenant.getName(),
            resolved.tokenPayload().email(),
            requiresAccountSetup,
            alreadyAccepted,
            resolved.invitation().getExpiresAt().toString()
        );
    }

    @Transactional
    public InvitationAcceptResponse accept(AcceptInvitationRequest request) {
        ResolvedInvitation resolved = resolveInvitation(request.token(), true);
        Tenant tenant = resolved.tenant();
        InvitationTokenService.InviteTokenPayload payload = resolved.tokenPayload();
        TenantMembership membership = resolved.membership();
        TenantInvitation invitation = resolved.invitation();

        if (MEMBER_STATUS_ACTIVE.equalsIgnoreCase(membership.getStatus())) {
            markInvitationAccepted(invitation);
            return new InvitationAcceptResponse(
                true,
                true,
                tenant.getId().toString(),
                tenant.getKey(),
                tenant.getName(),
                payload.email(),
                "Vous êtes déjà membre de cette organisation."
            );
        }

        if (!MEMBER_STATUS_INVITED.equalsIgnoreCase(membership.getStatus())) {
            throw new IllegalArgumentException("INVALID_OR_EXPIRED_INVITATION");
        }

        boolean requiresAccountSetup = keycloakProvisioningPort.isEnabled()
            && !keycloakProvisioningPort.userExists(payload.email());

        if (requiresAccountSetup) {
            validateNewAccountFields(request);
            provisionKeycloakUser(payload.email(), request);
        }

        AppUser user = appUserRepository.findByEmailIgnoreCase(payload.email())
            .orElseThrow(() -> new IllegalStateException("User not found after invitation accept"));
        if (requiresAccountSetup && StringUtils.hasText(request.firstName()) && StringUtils.hasText(request.lastName())) {
            String displayName = (request.firstName().trim() + " " + request.lastName().trim()).trim();
            user.setName(displayName);
            appUserRepository.save(user);
        }

        membership.setStatus(MEMBER_STATUS_ACTIVE);
        tenantMembershipRepository.save(membership);
        markInvitationAccepted(invitation);

        try {
            invitationEmailPort.sendWelcomeEmail(payload.email(), tenant.getName(), user.getName());
        } catch (Exception e) {
            log.warn("Welcome email failed for {}: {}", payload.email(), e.getMessage());
        }

        log.info("Invitation accepted email={} tenantId={}", payload.email(), tenant.getId());
        return new InvitationAcceptResponse(
            false,
            true,
            tenant.getId().toString(),
            tenant.getKey(),
            tenant.getName(),
            payload.email(),
            requiresAccountSetup
                ? "Votre compte a été créé. Connectez-vous pour accéder à l'organisation."
                : "Invitation acceptée. Connectez-vous pour accéder à l'organisation."
        );
    }

    private void validateNewAccountFields(AcceptInvitationRequest request) {
        if (!StringUtils.hasText(request.password())
            || request.password().length() < 8
            || !StringUtils.hasText(request.firstName())
            || !StringUtils.hasText(request.lastName())) {
            throw new IllegalArgumentException("ACCOUNT_SETUP_REQUIRED");
        }
    }

    private void provisionKeycloakUser(String email, AcceptInvitationRequest request) {
        try {
            keycloakProvisioningPort.provisionInvitedUser(
                email,
                request.password(),
                request.firstName().trim(),
                request.lastName().trim()
            );
        } catch (Exception e) {
            log.error("Keycloak provisioning failed for invited user {}", email, e);
            throw new IllegalStateException("KEYCLOAK_PROVISIONING_FAILED", e);
        }
    }

    private ResolvedInvitation resolveInvitation(String token, boolean strictPending) {
        InvitationTokenService.InviteTokenPayload payload;
        try {
            payload = invitationTokenService.validateToken(token);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("INVALID_OR_EXPIRED_INVITATION", e);
        }

        TenantInvitation invitation = tenantInvitationRepository.findByTokenJti(payload.jti())
            .orElseThrow(() -> new IllegalArgumentException("INVALID_OR_EXPIRED_INVITATION"));

        if (TenantInvitation.STATUS_REVOKED.equals(invitation.getStatus())) {
            throw new IllegalArgumentException("INVALID_OR_EXPIRED_INVITATION");
        }
        if (TenantInvitation.STATUS_EXPIRED.equals(invitation.getStatus())
            || invitation.getExpiresAt().isBefore(OffsetDateTime.now())) {
            if (!TenantInvitation.STATUS_EXPIRED.equals(invitation.getStatus())) {
                invitation.setStatus(TenantInvitation.STATUS_EXPIRED);
                tenantInvitationRepository.save(invitation);
            }
            throw new IllegalArgumentException("INVITATION_TOKEN_EXPIRED");
        }
        if (strictPending && !TenantInvitation.STATUS_PENDING.equals(invitation.getStatus())) {
            if (TenantInvitation.STATUS_ACCEPTED.equals(invitation.getStatus())) {
                Tenant tenant = tenantRepository.findById(payload.tenantId())
                    .orElseThrow(() -> new IllegalArgumentException("INVALID_OR_EXPIRED_INVITATION"));
                TenantMembership membership = tenantMembershipRepository
                    .findByTenantIdAndUserId(payload.tenantId(), invitation.getUserId())
                    .orElseThrow(() -> new IllegalArgumentException("INVALID_OR_EXPIRED_INVITATION"));
                return new ResolvedInvitation(payload, invitation, tenant, membership);
            }
            throw new IllegalArgumentException("INVALID_OR_EXPIRED_INVITATION");
        }

        if (!invitation.getTenantId().equals(payload.tenantId())
            || !normalizeEmail(invitation.getEmail()).equals(normalizeEmail(payload.email()))) {
            throw new IllegalArgumentException("INVALID_OR_EXPIRED_INVITATION");
        }

        Tenant tenant = tenantRepository.findById(payload.tenantId())
            .orElseThrow(() -> new IllegalArgumentException("INVALID_OR_EXPIRED_INVITATION"));

        TenantMembership membership = tenantMembershipRepository
            .findByTenantIdAndUserId(payload.tenantId(), invitation.getUserId())
            .orElseThrow(() -> new IllegalArgumentException("INVALID_OR_EXPIRED_INVITATION"));

        if (!normalizeEmail(payload.email()).equals(normalizeEmail(membershipEmail(membership)))) {
            throw new IllegalArgumentException("INVALID_OR_EXPIRED_INVITATION");
        }

        return new ResolvedInvitation(payload, invitation, tenant, membership);
    }

    private String membershipEmail(TenantMembership membership) {
        return appUserRepository.findById(membership.getUserId())
            .map(AppUser::getEmail)
            .orElseThrow(() -> new IllegalArgumentException("INVALID_OR_EXPIRED_INVITATION"));
    }

    private void markInvitationAccepted(TenantInvitation invitation) {
        if (!TenantInvitation.STATUS_ACCEPTED.equals(invitation.getStatus())) {
            invitation.setStatus(TenantInvitation.STATUS_ACCEPTED);
            invitation.setAcceptedAt(OffsetDateTime.now());
            tenantInvitationRepository.save(invitation);
        }
    }

    private static String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    private record ResolvedInvitation(
        InvitationTokenService.InviteTokenPayload tokenPayload,
        TenantInvitation invitation,
        Tenant tenant,
        TenantMembership membership
    ) {}
}
