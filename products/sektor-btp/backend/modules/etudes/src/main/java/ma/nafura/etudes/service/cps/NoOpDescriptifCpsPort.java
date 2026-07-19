package ma.nafura.etudes.service.cps;

import java.util.List;
import java.util.Optional;
import ma.nafura.etudes.domain.model.CpsSection;
import ma.nafura.etudes.domain.model.DpgfNoeud;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Bean;

/**
 * Implementation par defaut : aucune suggestion.
 *
 * <p>Le parcours reste entierement utilisable sans IA — la recherche plein texte remonte les
 * sections pertinentes, et le chiffreur redige lui-meme. C'est le principe pose des le depart :
 * verrouiller le processus manuel avant de brancher le modele.
 */
@Configuration
public class NoOpDescriptifCpsPort {

    @Bean
    @ConditionalOnMissingBean(DescriptifCpsPort.class)
    public DescriptifCpsPort noOpDescriptifCpsPort() {
        return new DescriptifCpsPort() {
            @Override
            public boolean isAvailable() {
                return false;
            }

            @Override
            public Optional<DescriptifPropose> proposer(DpgfNoeud article, List<CpsSection> sections) {
                return Optional.empty();
            }
        };
    }
}
