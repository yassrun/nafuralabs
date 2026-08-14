package ma.nafura.erp.onboarding.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.Map;

public final class OnboardingDtos {

    private OnboardingDtos() {}

    public record SignupRequest(
        @NotBlank @Email String email,
        @NotBlank @Size(min = 8, max = 128) String password,
        @NotBlank @Size(max = 80) String firstName,
        @NotBlank @Size(max = 80) String lastName,
        @Pattern(regexp = "^(fr|en|ar)$") String preferredLocale
    ) {}

    public record SignupResponse(
        String userId,
        String email,
        String message,
        boolean emailVerificationRequired,
        String accessToken,
        long expiresIn,
        boolean resumed,
        boolean loginRequired
    ) {}

    public record VerifyEmailRequest(@NotBlank String token) {}

    public record ResendVerificationEmailRequest(@NotBlank @Email String email) {}

    public record ResendVerificationEmailResponse(String email, String message) {}

    public record CreateTenantRequest(
        @NotBlank @Size(max = 200) String companyName,
        @Pattern(regexp = "^\\d{15}$", message = "ICE must be 15 digits") String ice,
        @Size(max = 50) String legalForm
    ) {}

    public record CreateTenantResponse(
        String tenantId,
        String tenantKey,
        String tenantName,
        String accessToken,
        long expiresIn
    ) {}

    public record SocietePresetDto(
        @NotBlank String nom,
        @Pattern(regexp = "^\\d{15}$") String ice,
        String forme
    ) {}

    public record ApplyPresetRequest(
        @NotNull SocietePresetDto societe,
        @NotBlank String secteur,
        @NotBlank String taille,
        @NotBlank String marches,
        @NotBlank String compta,
        boolean forceReset
    ) {}

    public record ApplyPresetResponse(
        String tenantId,
        boolean applied,
        List<String> completedSteps,
        long durationMs
    ) {}

    public record OnboardingStateResponse(
        int currentStep,
        Map<String, Object> answers,
        String tenantId,
        boolean completed
    ) {}

    public record SaveOnboardingStateRequest(
        int currentStep,
        Map<String, Object> answers,
        String tenantId
    ) {}

    public record CompletenessSectionDto(
        String id,
        String label,
        boolean complete,
        int weight
    ) {}

    public record CompletenessResponse(
        int score,
        List<CompletenessSectionDto> sections
    ) {}

    public record BulkInviteRequest(
        @NotNull List<@Email String> emails,
        @NotBlank String defaultRole
    ) {}

    public record BulkInviteResponse(
        int sent,
        int skipped,
        List<String> errors
    ) {}

    public record AgentParseRequest(
        @NotBlank String questionId,
        @NotBlank String userMessage,
        Map<String, Object> context
    ) {}

    public record AgentParseResponse(
        Map<String, Object> extracted,
        ApplyPresetRequest normalizedPreset
    ) {}
}
