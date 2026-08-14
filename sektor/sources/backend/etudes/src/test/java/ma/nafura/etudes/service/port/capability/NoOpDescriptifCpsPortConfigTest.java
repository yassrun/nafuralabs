package ma.nafura.etudes.service.port.capability;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

/**
 * Le contexte Spring doit se charger — pas seulement compiler.
 *
 * <p>Motif : cette configuration a mis l'application en CrashLoopBackOff sur staging alors que
 * {@code :sektor:app:build} était vert et que 177 tests passaient. La classe
 * {@code @Configuration} s'appelait {@code NoOpDescriptifCpsPort}, donc Spring l'enregistrait
 * sous le nom {@code noOpDescriptifCpsPort} — nom que portait <b>aussi</b> sa méthode
 * {@code @Bean}. Collision, et {@code BeanDefinitionOverrideException} au démarrage.
 *
 * <p>Aucun test ne chargeait de contexte : l'erreur n'était donc visible qu'au déploiement.
 * {@link ApplicationContextRunner} le fait sans base de données ni application complète.
 */
class NoOpDescriptifCpsPortConfigTest {

    private final ApplicationContextRunner runner =
            new ApplicationContextRunner().withUserConfiguration(NoOpDescriptifCpsPortConfig.class);

    @Test
    void la_configuration_se_charge_sans_collision_de_nom() {
        runner.run(context -> assertThat(context)
                .as("le contexte doit démarrer — un nom de bean en double le ferait échouer")
                .hasNotFailed());
    }

    @Test
    void le_port_par_defaut_est_expose_et_se_declare_indisponible() {
        runner.run(context -> {
            assertThat(context).hasSingleBean(DescriptifCpsPort.class);
            // Sans IA branchée, le port doit dire qu'il ne l'est pas : le parcours manuel
            // reste utilisable, il ne reçoit simplement aucune suggestion.
            assertThat(context.getBean(DescriptifCpsPort.class).isAvailable()).isFalse();
        });
    }
}
