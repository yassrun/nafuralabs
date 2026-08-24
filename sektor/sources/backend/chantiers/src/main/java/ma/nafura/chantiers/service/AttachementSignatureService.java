package ma.nafura.chantiers.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.UUID;
import java.util.function.Supplier;
import ma.nafura.chantiers.api.dto.AttachementChantierDto;
import ma.nafura.chantiers.api.dto.LienSignatureDto;
import ma.nafura.chantiers.api.dto.SignAttachementInfoDto;
import ma.nafura.chantiers.api.request.SignSubmitDto;
import ma.nafura.chantiers.domain.attachement.AttachementChantier;
import ma.nafura.chantiers.domain.attachement.AttachementSignatureToken;
import ma.nafura.chantiers.repository.AttachementSignatureTokenRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * AC-19 du contrat {@code avancement-et-attachement} — le jeton du lien public de signature.
 *
 * <p>Avant : {@code resolveAttachementId} rendait le jeton tel quel — le jeton **était**
 * l'identifiant de l'attachement, devinable et énumérable par quiconque le connaît. Depuis
 * qu'AC-15 en a fait la pièce qui fait foi pour facturer, cette serrure ouverte n'est plus
 * supportable.
 *
 * <p>Même mécanique que {@code GuestAccessService} (étude) : un secret aléatoire de 32 octets
 * ({@link SecureRandom}), jamais stocké en clair — seul son hash SHA-256 l'est
 * ({@link AttachementSignatureToken#getTokenHash()}). Daté, à usage unique, et un seul refus
 * ({@link SignatureTokenInvalideException}) pour les trois cas : inconnu, expiré, déjà consommé —
 * aucun des trois ne dit si l'attachement existe.
 */
@Service
public class AttachementSignatureService {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final int DEFAULT_EXPIRY_DAYS = 7;
    private static final String SIGN_URL_PREFIX = "/api/v1/sign/";

    private final AttachementChantierService attachementService;
    private final AttachementSignatureTokenRepository tokenRepository;

    public AttachementSignatureService(
            AttachementChantierService attachementService, AttachementSignatureTokenRepository tokenRepository) {
        this.attachementService = attachementService;
        this.tokenRepository = tokenRepository;
    }

    /** Génère un nouveau lien — appelé depuis un écran authentifié, jamais depuis le lien public. */
    @Transactional
    public LienSignatureDto genererLien(String attachementId) {
        UUID tenantId = TenantContext.getTenantId();
        // Vérifie l'existence dans le tenant courant avant de forger un secret pour rien.
        attachementService.getById(attachementId);

        String rawToken = newToken();
        AttachementSignatureToken token = AttachementSignatureToken.builder()
                .tenantId(tenantId)
                .attachementId(attachementId)
                .tokenHash(hashToken(rawToken))
                .expiresAt(OffsetDateTime.now().plusDays(DEFAULT_EXPIRY_DAYS))
                .build();
        tokenRepository.save(token);

        return LienSignatureDto.builder()
                .token(rawToken)
                .url(SIGN_URL_PREFIX + rawToken)
                .expiresAt(token.getExpiresAt())
                .build();
    }

    @Transactional(readOnly = true)
    public SignAttachementInfoDto getSignInfo(String rawToken) {
        AttachementSignatureToken token = requireUsable(rawToken);
        return withTenant(token, () -> {
            AttachementChantierDto att = attachementService.getById(token.getAttachementId());
            String role = AttachementChantier.STATUS_EN_ATTENTE_MOA.equals(att.getStatus()) ? "MOA" : "MOE";
            return SignAttachementInfoDto.builder()
                    .attachementId(att.getId())
                    .numero(att.getNumero())
                    .chantierCode(att.getChantierCode())
                    .dateDebut(att.getDateDebut() != null ? att.getDateDebut().toString() : null)
                    .dateFin(att.getDateFin() != null ? att.getDateFin().toString() : null)
                    .status(att.getStatus())
                    .role(role)
                    .build();
        });
    }

    /** AC-19 — usage unique : la signature déposée consomme le jeton, il ne rouvre plus rien. */
    @Transactional
    public AttachementChantierDto submitSignature(String rawToken, SignSubmitDto body) {
        AttachementSignatureToken token = requireUsable(rawToken);
        return withTenant(token, () -> {
            AttachementChantierDto result =
                    attachementService.applySignature(token.getAttachementId(), body.getSignatureBase64());
            token.setConsumedAt(OffsetDateTime.now());
            tokenRepository.save(token);
            return result;
        });
    }

    private AttachementSignatureToken requireUsable(String rawToken) {
        if (!StringUtils.hasText(rawToken)) {
            throw new SignatureTokenInvalideException();
        }
        AttachementSignatureToken token = tokenRepository
                .findByTokenHash(hashToken(rawToken.trim()))
                .orElseThrow(SignatureTokenInvalideException::new);
        if (!token.isUsable(OffsetDateTime.now())) {
            throw new SignatureTokenInvalideException();
        }
        return token;
    }

    private <T> T withTenant(AttachementSignatureToken token, Supplier<T> action) {
        TenantContext.setTenantId(token.getTenantId());
        try {
            return action.get();
        } finally {
            TenantContext.clear();
        }
    }

    private static String newToken() {
        byte[] raw = new byte[32];
        RANDOM.nextBytes(raw);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(raw);
    }

    static String hashToken(String raw) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(raw.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }
}
