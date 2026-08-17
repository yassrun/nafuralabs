package ma.nafura.etudes.api.dto;

import java.time.OffsetDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GuestLinkCreatedDto {

    /** Jeton en clair — renvoyé une seule fois. */
    private String token;

    private String email;

    private String purpose;

    private OffsetDateTime expiresAt;
}
