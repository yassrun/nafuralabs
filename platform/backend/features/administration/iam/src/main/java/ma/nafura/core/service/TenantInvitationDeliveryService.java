package ma.nafura.platform.administration.iam.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.nafura.platform.administration.iam.domain.model.TenantInvitation;
import ma.nafura.platform.administration.iam.repository.TenantInvitationRepository;
import ma.nafura.platform.administration.iam.service.port.InvitationEmailPort;
import ma.nafura.platform.tenancy.domain.model.Tenant;
import ma.nafura.platform.tenancy.repository.TenantRepository;
import ma.nafura.platform.framework.context.UserContext;
import ma.nafura.platform.identity.domain.model.AppUser;
import ma.nafura.platform.identity.repository.AppUserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class TenantInvitationDeliveryService {

    private final InvitationTokenService invitationTokenService;
    private final TenantInvitationRepository tenantInvitationRepository;
    private final TenantRepository tenantRepository;
    private final AppUserRepository appUserRepository;
    private final InvitationEmailPort invitationEmailPort;

    @Value("${app.frontend-base-url:http://localhost:4200}")
    private String frontendBaseUrl;

    @Transactional
    public String createAndSendInvitation(
        UUID tenantId,
        UUID userId,
        String email,
        List<String> roles,
        String message
    ) {
        revokePendingInvitations(tenantId, userId);

        InvitationTokenService.GeneratedToken generated = invitationTokenService.generateInviteToken(tenantId, email, roles);
        TenantInvitation invitation = TenantInvitation.builder()
            .tenantId(tenantId)
            .userId(userId)
            .email(normalizeEmail(email))
            .tokenJti(generated.jti())
            .status(TenantInvitation.STATUS_PENDING)
            .emailDeliveryStatus(TenantInvitation.DELIVERY_PENDING)
            .inviterMessage(message)
            .expiresAt(OffsetDateTime.ofInstant(generated.expiresAt(), ZoneOffset.UTC))
            .build();
        invitation = tenantInvitationRepository.save(invitation);

        return sendInvitationEmail(tenantId, email, generated.token(), message, invitation);
    }

    @Transactional
    public String resendInvitation(UUID tenantId, UUID userId, String email, List<String> roles) {
        return createAndSendInvitation(tenantId, userId, email, roles, null);
    }

    private String sendInvitationEmail(
        UUID tenantId,
        String email,
        String token,
        String message,
        TenantInvitation invitation
    ) {
        Tenant tenant = tenantRepository.findById(tenantId).orElse(null);
        String tenantName = tenant != null ? tenant.getName() : "Organization";
        String inviteLink = frontendBaseUrl + "/invite/accept?token=" + token;
        String inviterName = resolveInviterName();

        try {
            if (!invitationEmailPort.isAvailable()) {
                throw new IllegalStateException("EMAIL_DELIVERY_FAILED");
            }
            invitationEmailPort.sendInvitationEmail(email, tenantName, inviteLink, inviterName, message);
            invitation.setEmailDeliveryStatus(TenantInvitation.DELIVERY_SENT);
            tenantInvitationRepository.save(invitation);
            return TenantInvitation.DELIVERY_SENT;
        } catch (Exception e) {
            log.warn("Failed to send invitation email to {}: {}", email, e.getMessage());
            invitation.setEmailDeliveryStatus(TenantInvitation.DELIVERY_FAILED);
            tenantInvitationRepository.save(invitation);
            return TenantInvitation.DELIVERY_FAILED;
        }
    }

    private void revokePendingInvitations(UUID tenantId, UUID userId) {
        List<TenantInvitation> pending = tenantInvitationRepository
            .findByTenantIdAndUserIdAndStatus(tenantId, userId, TenantInvitation.STATUS_PENDING);
        for (TenantInvitation existing : pending) {
            existing.setStatus(TenantInvitation.STATUS_REVOKED);
            tenantInvitationRepository.save(existing);
        }
    }

    private String resolveInviterName() {
        try {
            UUID userId = UserContext.getUserIdOrNull();
            if (userId != null) {
                return appUserRepository.findById(userId).map(AppUser::getName).orElse(UserContext.getUserEmail());
            }
        } catch (Exception ignored) {
            // fall through
        }
        return UserContext.getUserEmail() != null ? UserContext.getUserEmail() : "A team member";
    }

    private static String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
