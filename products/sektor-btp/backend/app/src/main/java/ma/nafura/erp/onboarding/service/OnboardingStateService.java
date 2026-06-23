package ma.nafura.erp.onboarding.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import ma.nafura.erp.onboarding.api.dto.OnboardingDtos.OnboardingStateResponse;
import ma.nafura.erp.onboarding.api.dto.OnboardingDtos.SaveOnboardingStateRequest;
import ma.nafura.erp.onboarding.domain.UserOnboardingState;
import ma.nafura.erp.onboarding.repository.UserOnboardingStateRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class OnboardingStateService {

    private final UserOnboardingStateRepository repository;
    private final ObjectMapper objectMapper;

    public OnboardingStateResponse getState(UUID userId) {
        UserOnboardingState state = repository.findByUserId(userId)
            .orElseThrow(() -> new IllegalArgumentException("Onboarding state not found"));
        return toResponse(state);
    }

    @Transactional
    public OnboardingStateResponse saveState(UUID userId, SaveOnboardingStateRequest request) {
        UserOnboardingState state = repository.findByUserId(userId)
            .orElseThrow(() -> new IllegalArgumentException("Onboarding state not found"));
        state.setCurrentStep(request.currentStep());
        try {
            state.setAnswersJson(objectMapper.writeValueAsString(request.answers()));
        } catch (Exception ex) {
            throw new IllegalArgumentException("Invalid answers payload");
        }
        if (request.tenantId() != null && !request.tenantId().isBlank()) {
            state.setTenantId(UUID.fromString(request.tenantId()));
        }
        if (request.currentStep() >= 5) {
            state.setCompletedAt(java.time.OffsetDateTime.now());
        }
        return toResponse(repository.save(state));
    }

    @Transactional
    public void linkTenant(UUID userId, UUID tenantId) {
        UserOnboardingState state = repository.findByUserId(userId)
            .orElseThrow(() -> new IllegalArgumentException("Onboarding state not found"));
        state.setTenantId(tenantId);
        repository.save(state);
    }

    private OnboardingStateResponse toResponse(UserOnboardingState state) {
        Map<String, Object> answers = Map.of();
        try {
            if (state.getAnswersJson() != null && !state.getAnswersJson().isBlank()) {
                answers = objectMapper.readValue(state.getAnswersJson(), new TypeReference<>() {});
            }
        } catch (Exception ignored) {
            // keep empty map
        }
        return new OnboardingStateResponse(
            state.getCurrentStep(),
            answers,
            state.getTenantId() != null ? state.getTenantId().toString() : null,
            state.getCompletedAt() != null
        );
    }
}
