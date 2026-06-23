package ma.nafura.platform.administration.iam.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

/**
 * Generates and validates JWT-like invitation tokens (payload + HMAC signature).
 */
@Service
@RequiredArgsConstructor
public class InvitationTokenService {

    private static final String HMAC_SHA256 = "HmacSHA256";
    private static final long DEFAULT_EXPIRY_DAYS = 7;

    private final ObjectMapper objectMapper;

    @Value("${app.invitation.token-secret:change-me-in-production}")
    private String tokenSecret;

    @Value("${app.invitation.expiry-days:7}")
    private long expiryDays;

    public String generateInviteToken(UUID tenantId, String email, List<String> roles) {
        long exp = Instant.now().plusSeconds(expiryDays * 86400).getEpochSecond();
        Payload payload = new Payload(tenantId.toString(), email, roles, exp);
        try {
            String payloadJson = objectMapper.writeValueAsString(payload);
            String payloadB64 = Base64.getUrlEncoder().withoutPadding().encodeToString(payloadJson.getBytes(StandardCharsets.UTF_8));
            byte[] sig = hmac(tokenSecret.getBytes(StandardCharsets.UTF_8), payloadB64.getBytes(StandardCharsets.UTF_8));
            String sigB64 = Base64.getUrlEncoder().withoutPadding().encodeToString(sig);
            return payloadB64 + "." + sigB64;
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate invite token", e);
        }
    }

    public InviteTokenPayload validateToken(String token) {
        if (token == null || !token.contains(".")) {
            throw new IllegalArgumentException("Invalid invitation token");
        }
        int dot = token.indexOf('.');
        String payloadB64 = token.substring(0, dot);
        String sigB64 = token.substring(dot + 1);
        try {
            byte[] expectedSig = hmac(tokenSecret.getBytes(StandardCharsets.UTF_8), payloadB64.getBytes(StandardCharsets.UTF_8));
            byte[] actualSig = Base64.getUrlDecoder().decode(sigB64);
            if (!java.security.MessageDigest.isEqual(expectedSig, actualSig)) {
                throw new IllegalArgumentException("Invalid invitation token signature");
            }
            String payloadJson = new String(Base64.getUrlDecoder().decode(payloadB64), StandardCharsets.UTF_8);
            Payload p = objectMapper.readValue(payloadJson, Payload.class);
            if (Instant.now().getEpochSecond() > p.exp) {
                throw new IllegalArgumentException("Invitation token has expired");
            }
            return new InviteTokenPayload(UUID.fromString(p.tenantId), p.email, p.roles != null ? p.roles : List.of());
        } catch (Exception e) {
            if (e instanceof IllegalArgumentException) throw (IllegalArgumentException) e;
            throw new IllegalArgumentException("Invalid invitation token", e);
        }
    }

    private static byte[] hmac(byte[] key, byte[] data) throws NoSuchAlgorithmException, InvalidKeyException {
        Mac mac = Mac.getInstance(HMAC_SHA256);
        mac.init(new SecretKeySpec(key, HMAC_SHA256));
        return mac.doFinal(data);
    }

    private static class Payload {
        public String tenantId;
        public String email;
        public List<String> roles;
        public long exp;

        @SuppressWarnings("unused")
        Payload() {}

        Payload(String tenantId, String email, List<String> roles, long exp) {
            this.tenantId = tenantId;
            this.email = email;
            this.roles = roles;
            this.exp = exp;
        }
    }

    public record InviteTokenPayload(UUID tenantId, String email, List<String> roles) {}
}

