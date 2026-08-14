package ma.nafura.etudes.service.port;

import java.util.Optional;
import java.util.UUID;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;

/**
 * Fallback pour les tests du module études sans dépendre de Partner.
 *
 * <p>Accepte tout UUID parseable ; refuse les identifiants non-UUID.
 */
@Configuration
public class NoOpEtudeClientPortConfig {

    @Bean
    @ConditionalOnMissingBean(EtudeClientPort.class)
    public EtudeClientPort noOpEtudeClientPort() {
        return new EtudeClientPort() {
            @Override
            public Optional<ClientSnapshot> resolve(String clientId) {
                if (!StringUtils.hasText(clientId)) {
                    return Optional.empty();
                }
                return Optional.of(snapshot(clientId.trim()));
            }

            @Override
            public ClientSnapshot requireClient(String clientId) {
                if (!StringUtils.hasText(clientId)) {
                    throw new IllegalArgumentException("etudes.gate.chiffrage.client_manquant");
                }
                return snapshot(clientId.trim());
            }

            @Override
            public ClientSnapshot requireClientRole(String clientId) {
                return requireClient(clientId);
            }

            private ClientSnapshot snapshot(String raw) {
                UUID id;
                try {
                    id = UUID.fromString(raw);
                } catch (IllegalArgumentException ex) {
                    throw new IllegalArgumentException("etudes.client.id_invalide");
                }
                return new ClientSnapshot(id, "NOOP", "Client " + id);
            }
        };
    }
}
