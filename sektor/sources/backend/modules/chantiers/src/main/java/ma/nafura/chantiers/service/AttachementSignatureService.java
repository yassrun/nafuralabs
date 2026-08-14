package ma.nafura.chantiers.service;

import ma.nafura.chantiers.api.dto.AttachementChantierDto;
import ma.nafura.chantiers.api.dto.SignAttachementInfoDto;
import ma.nafura.chantiers.api.request.SignSubmitDto;
import ma.nafura.chantiers.domain.model.AttachementChantier;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AttachementSignatureService {

    private final AttachementChantierService attachementService;

    public AttachementSignatureService(AttachementChantierService attachementService) {
        this.attachementService = attachementService;
    }

    /**
     * Stub token = attachement id (JWT to be implemented later).
     */
    @Transactional(readOnly = true)
    public SignAttachementInfoDto getSignInfo(String token) {
        AttachementChantierDto att = attachementService.getById(resolveAttachementId(token));
        String role = AttachementChantier.STATUS_EN_ATTENTE_MOA.equals(att.getStatus()) ? "MOA" : "MOE";
        return SignAttachementInfoDto.builder()
                .attachementId(att.getId())
                .numero(att.getNumero())
                .chantierCode(att.getChantierCode())
                .date(att.getDate() != null ? att.getDate().toString() : null)
                .status(att.getStatus())
                .role(role)
                .build();
    }

    @Transactional
    public AttachementChantierDto submitSignature(String token, SignSubmitDto body) {
        return attachementService.applySignature(resolveAttachementId(token), body.getSignatureBase64());
    }

    private String resolveAttachementId(String token) {
        if (token == null || token.isBlank()) {
            throw new IllegalArgumentException("Invalid signature token");
        }
        return token.trim();
    }
}
