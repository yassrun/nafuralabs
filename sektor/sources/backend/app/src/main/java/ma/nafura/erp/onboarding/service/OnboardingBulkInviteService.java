package ma.nafura.erp.onboarding.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import ma.nafura.erp.onboarding.api.dto.OnboardingDtos.BulkInviteRequest;
import ma.nafura.erp.onboarding.api.dto.OnboardingDtos.BulkInviteResponse;
import ma.nafura.platform.administration.iam.api.request.tenant.InviteMemberRequest;
import ma.nafura.platform.administration.iam.service.IamService;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class OnboardingBulkInviteService {

    private final IamService iamService;
    private final TenantProvisioningService provisioningService;

    public BulkInviteResponse bulkInvite(UUID tenantId, UUID requesterUserId, BulkInviteRequest request) {
        provisioningService.assertOwnerMembership(tenantId, requesterUserId);

        String role = request.defaultRole() == null ? "MEMBER" : request.defaultRole().trim().toUpperCase(Locale.ROOT);
        int sent = 0;
        int skipped = 0;
        List<String> errors = new ArrayList<>();

        for (String rawEmail : request.emails()) {
            if (rawEmail == null || rawEmail.isBlank()) {
                continue;
            }
            String email = rawEmail.trim().toLowerCase(Locale.ROOT);
            try {
                iamService.inviteMember(tenantId, new InviteMemberRequest(email, List.of(role), null));
                sent++;
            } catch (IllegalArgumentException ex) {
                if (ex.getMessage() != null && ex.getMessage().toLowerCase(Locale.ROOT).contains("already")) {
                    skipped++;
                } else {
                    errors.add(email + ": " + ex.getMessage());
                }
            } catch (Exception ex) {
                errors.add(email + ": " + ex.getMessage());
            }
        }

        return new BulkInviteResponse(sent, skipped, errors);
    }
}
