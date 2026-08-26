package ma.nafura.chantiers.api.controller;

import static org.assertj.core.api.Assertions.assertThat;

import java.lang.reflect.Method;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import org.junit.jupiter.api.Test;

class ChantierPortefeuilleControllerPermissionTest {

    @Test
    void portefeuilleUtiliseActionReadDuSecuredResource() {
        Method endpoint = java.util.Arrays.stream(ChantierPortefeuilleController.class.getDeclaredMethods())
                .filter(m -> m.getName().equals("lister"))
                .findFirst().orElseThrow();

        RequirePermission permission = endpoint.getAnnotation(RequirePermission.class);

        assertThat(permission).isNotNull();
        assertThat(permission.value()).isEqualTo("read");
        assertThat(permission.fullPermission()).isFalse();
    }
}
