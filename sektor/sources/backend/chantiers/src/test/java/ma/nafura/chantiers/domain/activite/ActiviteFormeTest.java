package ma.nafura.chantiers.domain.activite;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

class ActiviteFormeTest {

    @Test
    void parse_etDefautMigration() {
        assertThat(ActiviteForme.parse("phase")).isEqualTo(ActiviteForme.PHASE);
        assertThat(ActiviteForme.parse(null)).isNull();
        assertThat(ActiviteForme.orDefault(null)).isEqualTo(ActiviteForme.ACTIVITE);
        assertThat(ActiviteForme.PHASE.porteQuantite()).isFalse();
        assertThat(ActiviteForme.JALON.porteQuantite()).isFalse();
        assertThat(ActiviteForme.ACTIVITE.porteQuantite()).isTrue();
    }

    @Test
    void parse_inconnue_refuse() {
        assertThatThrownBy(() -> ActiviteForme.parse("TACHE"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("chantiers.activite.forme_inconnue");
    }

    @Test
    void nature_applicableSelonForme() {
        ActiviteNature travaux = ActiviteNature.builder()
                .code("TRAVAUX")
                .forme(ActiviteForme.ACTIVITE)
                .actif(true)
                .build();
        ActiviteNature jalon = ActiviteNature.builder()
                .code("JALON_TECHNIQUE")
                .forme(ActiviteForme.JALON)
                .actif(true)
                .build();

        assertThat(travaux.applicableA(ActiviteForme.ACTIVITE)).isTrue();
        assertThat(travaux.applicableA(ActiviteForme.PHASE)).isTrue();
        assertThat(travaux.applicableA(ActiviteForme.JALON)).isFalse();
        assertThat(jalon.applicableA(ActiviteForme.JALON)).isTrue();
        assertThat(jalon.applicableA(ActiviteForme.ACTIVITE)).isFalse();
    }
}
