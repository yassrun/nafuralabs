package ma.nafura.chantiers.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.chantiers.api.dto.AttachementChantierDto;
import ma.nafura.chantiers.api.dto.LienSignatureDto;
import ma.nafura.chantiers.api.request.SignSubmitDto;
import ma.nafura.chantiers.domain.attachement.AttachementSignatureToken;
import ma.nafura.chantiers.repository.AttachementSignatureTokenRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

/**
 * AC-19 — le jeton n'est pas l'id de l'attachement : non devinable, daté, à usage unique, et un
 * seul refus pour les trois façons d'être invalide.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AttachementSignatureServiceTest {

    private static final UUID TENANT = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final String ATTACHEMENT = "att-1";

    @Mock private AttachementChantierService attachementService;
    @Mock private AttachementSignatureTokenRepository tokenRepository;

    private AttachementSignatureService service;
    private final List<AttachementSignatureToken> stockage = new ArrayList<>();

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TENANT);
        service = new AttachementSignatureService(attachementService, tokenRepository);
        stockage.clear();

        when(attachementService.getById(ATTACHEMENT))
                .thenReturn(AttachementChantierDto.builder().id(ATTACHEMENT).numero("ATT-1").status("BROUILLON").build());
        when(tokenRepository.save(any())).thenAnswer(inv -> {
            AttachementSignatureToken row = inv.getArgument(0);
            if (row.getId() == null) {
                row.setId(UUID.randomUUID());
            }
            stockage.removeIf(existing -> existing.getId().equals(row.getId()));
            stockage.add(row);
            return row;
        });
        when(tokenRepository.findByTokenHash(any())).thenAnswer(inv -> {
            String hash = inv.getArgument(0);
            return stockage.stream().filter(t -> t.getTokenHash().equals(hash)).findFirst();
        });
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    /** AC-19 — le jeton n'est pas l'id : générer un lien rend un secret distinct de ATTACHEMENT. */
    @Test
    void genererLien_rendUnJetonDistinctDeLId() {
        LienSignatureDto lien = service.genererLien(ATTACHEMENT);

        assertThat(lien.getToken()).isNotEqualTo(ATTACHEMENT);
        assertThat(lien.getToken().length()).isGreaterThan(30); // 32 octets aléatoires encodés
        assertThat(lien.getUrl()).contains(lien.getToken());
        assertThat(lien.getExpiresAt()).isAfter(OffsetDateTime.now());
    }

    /** AC-19 — un jeton connu et non expiré fonctionne. */
    @Test
    void jetonValide_resoutLAttachement() {
        String token = service.genererLien(ATTACHEMENT).getToken();

        var info = service.getSignInfo(token);

        assertThat(info.getAttachementId()).isEqualTo(ATTACHEMENT);
    }

    /** AC-19 — jeton inconnu : même refus. */
    @Test
    void jetonInconnu_estRefuse() {
        assertThatThrownBy(() -> service.getSignInfo("un-jeton-qui-n-existe-pas"))
                .isInstanceOf(SignatureTokenInvalideException.class);
    }

    /** AC-19 — jeton expiré : même refus. */
    @Test
    void jetonExpire_estRefuse() {
        String token = service.genererLien(ATTACHEMENT).getToken();
        stockage.getFirst().setExpiresAt(OffsetDateTime.now().minusSeconds(1));

        assertThatThrownBy(() -> service.getSignInfo(token)).isInstanceOf(SignatureTokenInvalideException.class);
    }

    /** AC-19 — usage unique : une fois la signature déposée, le jeton ne rouvre plus rien. */
    @Test
    void jetonDejaConsomme_estRefuse() {
        String token = service.genererLien(ATTACHEMENT).getToken();
        SignSubmitDto body = new SignSubmitDto();
        body.setSignatureBase64("c2lnbmF0dXJl");
        when(attachementService.applySignature(ATTACHEMENT, body.getSignatureBase64()))
                .thenReturn(AttachementChantierDto.builder().id(ATTACHEMENT).status("SIGNE_MOE").build());

        service.submitSignature(token, body);

        assertThatThrownBy(() -> service.getSignInfo(token)).isInstanceOf(SignatureTokenInvalideException.class);
        assertThatThrownBy(() -> service.submitSignature(token, body))
                .isInstanceOf(SignatureTokenInvalideException.class);
    }

    /** AC-19 — jeton vide ou nul : même refus, pas de NPE. */
    @Test
    void jetonVide_estRefuse() {
        assertThatThrownBy(() -> service.getSignInfo("")).isInstanceOf(SignatureTokenInvalideException.class);
        assertThatThrownBy(() -> service.getSignInfo(null)).isInstanceOf(SignatureTokenInvalideException.class);
    }
}
