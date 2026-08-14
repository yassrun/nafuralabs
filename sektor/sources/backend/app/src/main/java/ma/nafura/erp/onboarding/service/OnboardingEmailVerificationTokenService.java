package ma.nafura.erp.onboarding.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.Base64;
import java.util.UUID;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class OnboardingEmailVerificationTokenService {

    private static final String HMAC_SHA256 = "HmacSHA256";

    private final ObjectMapper objectMapper;

    @Value("${nafura.onboarding.email-verification-secret:${nafura.onboarding.dev-jwt-secret:nafura-local-onboarding-jwt-secret-32b-min}}")
    private String tokenSecret;

    @Value("${nafura.onboarding.email-verification-expiry-hours:48}")
    private long expiryHours;

    public String generateIntentToken(UUID intentId, String email) {
        return generateToken(new Payload(intentId.toString(), null, email, expiryEpoch()));
    }

    @Deprecated
    public String generateUserToken(UUID userId, String email) {
        return generateToken(new Payload(null, userId.toString(), email, expiryEpoch()));
    }

    public VerificationPayload validateToken(String token) {
        if (token == null || !token.contains(".")) {
            throw new IllegalArgumentException("INVALID_VERIFICATION_TOKEN");
        }
        int dot = token.indexOf('.');
        String payloadB64 = token.substring(0, dot);
        String sigB64 = token.substring(dot + 1);
        try {
            byte[] expectedSig = hmac(tokenSecret.getBytes(StandardCharsets.UTF_8), payloadB64.getBytes(StandardCharsets.UTF_8));
            byte[] actualSig = Base64.getUrlDecoder().decode(sigB64);
            if (!MessageDigest.isEqual(expectedSig, actualSig)) {
                throw new IllegalArgumentException("INVALID_VERIFICATION_TOKEN");
            }
            String payloadJson = new String(Base64.getUrlDecoder().decode(payloadB64), StandardCharsets.UTF_8);
            Payload p = objectMapper.readValue(payloadJson, Payload.class);
            if (Instant.now().getEpochSecond() > p.exp) {
                throw new IllegalArgumentException("VERIFICATION_TOKEN_EXPIRED");
            }
            UUID intentId = p.intentId != null && !p.intentId.isBlank() ? UUID.fromString(p.intentId) : null;
            UUID userId = p.userId != null && !p.userId.isBlank() ? UUID.fromString(p.userId) : null;
            if (intentId == null && userId == null) {
                throw new IllegalArgumentException("INVALID_VERIFICATION_TOKEN");
            }
            return new VerificationPayload(intentId, userId, p.email);
        } catch (IllegalArgumentException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new IllegalArgumentException("INVALID_VERIFICATION_TOKEN", ex);
        }
    }

    private String generateToken(Payload payload) {
        try {
            String payloadJson = objectMapper.writeValueAsString(payload);
            String payloadB64 = Base64.getUrlEncoder().withoutPadding()
                .encodeToString(payloadJson.getBytes(StandardCharsets.UTF_8));
            byte[] sig = hmac(tokenSecret.getBytes(StandardCharsets.UTF_8), payloadB64.getBytes(StandardCharsets.UTF_8));
            String sigB64 = Base64.getUrlEncoder().withoutPadding().encodeToString(sig);
            return payloadB64 + "." + sigB64;
        } catch (Exception e) {
            throw new IllegalStateException("Failed to generate verification token", e);
        }
    }

    private long expiryEpoch() {
        return Instant.now().plusSeconds(expiryHours * 3600).getEpochSecond();
    }

    private static byte[] hmac(byte[] key, byte[] data) throws NoSuchAlgorithmException, InvalidKeyException {
        Mac mac = Mac.getInstance(HMAC_SHA256);
        mac.init(new SecretKeySpec(key, HMAC_SHA256));
        return mac.doFinal(data);
    }

    private static class Payload {
        public String intentId;
        public String userId;
        public String email;
        public long exp;

        @SuppressWarnings("unused")
        Payload() {}

        Payload(String intentId, String userId, String email, long exp) {
            this.intentId = intentId;
            this.userId = userId;
            this.email = email;
            this.exp = exp;
        }
    }

    public record VerificationPayload(UUID intentId, UUID userId, String email) {}
}
