package ma.nafura.etudes.service;

import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Component;

/**
 * Lecture optionnelle des paramètres tenant. No-op tant que app-settings n'est pas branché
 * sur le module etudes (évite une dépendance circulaire / lourde). Les valeurs viennent alors
 * des constantes de {@link ParametresEtudeService}.
 */
@Component
public class TenantSettingReader {

    public Optional<String> findValue(UUID tenantId, String settingKey) {
        return Optional.empty();
    }
}
