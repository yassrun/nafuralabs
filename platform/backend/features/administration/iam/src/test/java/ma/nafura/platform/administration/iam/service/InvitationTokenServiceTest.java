package ma.nafura.platform.administration.iam.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class InvitationTokenServiceTest {

    private InvitationTokenService service;

    @BeforeEach
    void setUp() {
        service = new InvitationTokenService(new ObjectMapper());
        org.springframework.test.util.ReflectionTestUtils.setField(
            service,
            "tokenSecret",
            "test-invitation-secret-key-32chars-min"
        );
        org.springframework.test.util.ReflectionTestUtils.setField(service, "expiryDays", 7L);
    }

    @Test
    void generateAndValidateToken_roundTrip() {
        UUID tenantId = UUID.randomUUID();
        InvitationTokenService.GeneratedToken generated = service.generateInviteToken(
            tenantId,
            "Invitee@Example.com",
            List.of("MEMBER")
        );

        InvitationTokenService.InviteTokenPayload payload = service.validateToken(generated.token());

        assertThat(payload.tenantId()).isEqualTo(tenantId);
        assertThat(payload.email()).isEqualTo("invitee@example.com");
        assertThat(payload.jti()).isEqualTo(generated.jti());
        assertThat(payload.roles()).containsExactly("MEMBER");
    }

    @Test
    void validateToken_rejectsTamperedSignature() {
        InvitationTokenService.GeneratedToken generated = service.generateInviteToken(
            UUID.randomUUID(),
            "user@example.com",
            List.of("MEMBER")
        );
        String tampered = generated.token().substring(0, generated.token().length() - 2) + "xx";

        assertThatThrownBy(() -> service.validateToken(tampered))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("INVALID_INVITATION_TOKEN");
    }

    @Test
    void validateToken_rejectsExpiredToken() {
        org.springframework.test.util.ReflectionTestUtils.setField(service, "expiryDays", -1L);
        String token = service.generateInviteToken(
            UUID.randomUUID(),
            "user@example.com",
            List.of("MEMBER")
        ).token();

        assertThatThrownBy(() -> service.validateToken(token))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("INVITATION_TOKEN_EXPIRED");
    }
}
