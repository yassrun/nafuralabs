package ma.nafura.lab;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

class NafuraLabAutoConfigurationTest {

    private final ApplicationContextRunner runner = new ApplicationContextRunner()
            .withConfiguration(AutoConfigurations.of(NafuraLabAutoConfiguration.class));

    @Test
    void offByDefault() {
        runner.run(context -> {
            assertThat(context).hasNotFailed();
            assertThat(context).doesNotHaveBean(LabSessionController.class);
            assertThat(context).doesNotHaveBean(LabSeeder.class);
        });
    }

    @Test
    void refusesToStartUnderProdProfile() {
        runner.withPropertyValues("nafura.lab.enabled=true", "spring.profiles.active=prod")
                .run(context -> assertThat(context).getFailure()
                        .rootCause()
                        .hasMessageContaining("forbidden with the 'prod' profile"));
    }

    @Test
    void defaultsToASingleSuperAdmin() {
        LabProperties properties = new LabProperties(false, "nafura-lab", java.time.Duration.ofHours(12),
                new LabProperties.Tenant("lab", "Lab"), null);

        assertThat(properties.users()).singleElement()
                .satisfies(user -> assertThat(user.superAdmin()).isTrue());
        assertThat(properties.requireUser(null)).isEqualTo(properties.users().get(0));
        assertThat(properties.requireUser(" ADMIN@lab.local ")).isEqualTo(properties.users().get(0));
        assertThatThrownBy(() -> properties.requireUser("nobody@lab.local"))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
