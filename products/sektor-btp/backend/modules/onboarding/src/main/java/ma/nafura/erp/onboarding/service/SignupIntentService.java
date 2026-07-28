package ma.nafura.erp.onboarding.service;

import java.time.OffsetDateTime;
import java.util.Locale;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ma.nafura.erp.onboarding.api.dto.OnboardingDtos.SignupRequest;
import ma.nafura.erp.onboarding.domain.SignupIntent;
import ma.nafura.erp.onboarding.repository.SignupIntentRepository;

@Service
@RequiredArgsConstructor
public class SignupIntentService {

    private final SignupIntentRepository signupIntentRepository;
    private final SignupIntentPasswordCipher passwordCipher;

    @Value("${nafura.onboarding.email-verification-expiry-hours:48}")
    private long expiryHours;

    @Transactional
    public SignupIntent upsertIntent(SignupRequest request) {
        String email = normalizeEmail(request.email());
        OffsetDateTime expiresAt = OffsetDateTime.now().plusHours(expiryHours);
        String ciphertext = passwordCipher.encrypt(request.password());
        return signupIntentRepository.findByEmailIgnoreCase(email)
            .map(existing -> {
                existing.setFirstName(request.firstName().trim());
                existing.setLastName(request.lastName().trim());
                existing.setPreferredLocale(request.preferredLocale());
                existing.setPasswordCiphertext(ciphertext);
                existing.setExpiresAt(expiresAt);
                return signupIntentRepository.save(existing);
            })
            .orElseGet(() -> signupIntentRepository.save(SignupIntent.builder()
                .email(email)
                .firstName(request.firstName().trim())
                .lastName(request.lastName().trim())
                .preferredLocale(request.preferredLocale())
                .passwordCiphertext(ciphertext)
                .expiresAt(expiresAt)
                .build()));
    }

    public SignupIntent requireValidIntent(UUID intentId, String email) {
        SignupIntent intent = signupIntentRepository.findById(intentId)
            .orElseThrow(() -> new IllegalArgumentException("INVALID_VERIFICATION_TOKEN"));
        if (!intent.getEmail().equalsIgnoreCase(normalizeEmail(email))) {
            throw new IllegalArgumentException("INVALID_VERIFICATION_TOKEN");
        }
        if (intent.getExpiresAt().isBefore(OffsetDateTime.now())) {
            throw new IllegalArgumentException("VERIFICATION_TOKEN_EXPIRED");
        }
        return intent;
    }

    public SignupRequest toSignupRequest(SignupIntent intent) {
        String password = passwordCipher.decrypt(intent.getPasswordCiphertext());
        return new SignupRequest(
            intent.getEmail(),
            password,
            intent.getFirstName(),
            intent.getLastName(),
            intent.getPreferredLocale()
        );
    }

    @Transactional
    public void deleteIntent(SignupIntent intent) {
        signupIntentRepository.delete(intent);
    }

    public boolean hasIntent(String email) {
        return signupIntentRepository.findByEmailIgnoreCase(normalizeEmail(email)).isPresent();
    }

    public java.util.Optional<SignupIntent> findIntent(String email) {
        return signupIntentRepository.findByEmailIgnoreCase(normalizeEmail(email));
    }

    @Transactional
    public SignupIntent refreshIntentExpiry(SignupIntent intent) {
        intent.setExpiresAt(OffsetDateTime.now().plusHours(expiryHours));
        return signupIntentRepository.save(intent);
    }

    private static String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
