package ma.nafura.chantiers.api.dto;

import java.time.OffsetDateTime;
import lombok.Builder;
import lombok.Data;

/**
 * AC-19 — le jeton n'est rendu **qu'une fois**, à la génération du lien. Il n'est jamais
 * récupérable ensuite (seul son hash est stocké) : le perdre, c'est en régénérer un autre.
 */
@Data
@Builder
public class LienSignatureDto {

    private String token;
    private String url;
    private OffsetDateTime expiresAt;
}
