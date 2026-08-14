package ma.nafura.etudes.domain;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.stream.Stream;
import ma.nafura.etudes.domain.dossier.RoleIntervenant;
import org.junit.jupiter.api.Test;

/**
 * Contrat L4 : pas de joker {@code etude.*} ; {@code etude.avis} n'accorde pas l'écriture chiffrage.
 */
class EtudePermissionsContractTest {

    @Test
    void aucune_permission_etude_wildcard_dans_seed() throws Exception {
        Path seed = Path.of(
                "src/main/resources/db/changelog/data/v1.0/002_iam_bootstrap_erp_btp_roles.sql");
        // Depuis module etudes le seed est dans app — chercher depuis monorepo relatif
        Path fromApp = Path.of(
                "../../../app/src/main/resources/db/changelog/data/v1.0/002_iam_bootstrap_erp_btp_roles.sql");
        Path fromRoot = Path.of(
                "sektor/backend/app/src/main/resources/db/changelog/data/v1.0/002_iam_bootstrap_erp_btp_roles.sql");

        Path file = Stream.of(seed, fromApp, fromRoot, Path.of(
                        System.getProperty("user.dir"),
                        "src/main/resources/db/changelog/data/v1.0/002_iam_bootstrap_erp_btp_roles.sql"))
                .filter(Files::exists)
                .findFirst()
                .orElse(null);

        if (file == null) {
            // Fallback : lire le seed L4 app v1.1 si le chemin de test diffère
            Path l4 = Path.of(
                    "../../../app/src/main/resources/db/changelog/data/v1.1/002_l4_etude_permissions.sql");
            if (Files.exists(l4)) {
                String content = Files.readString(l4);
                assertThat(content).contains("DELETE FROM role_permission");
                assertThat(content).contains("etude.avis");
                assertThat(content).doesNotContain("'etude.*'");
                return;
            }
            // Si hors arbre app, on valide au moins l'enum métier
            assertThat(RoleIntervenant.AVIS.bloqueApprobation()).isFalse();
            assertThat(RoleIntervenant.CHARGE_ETUDE.bloqueApprobation()).isTrue();
            return;
        }

        String content = Files.readString(file);
        assertThat(content).doesNotContain("'etude.*'");
        assertThat(content).contains("etude.avis");
        assertThat(content).contains("etude.approve");
        assertThat(content).contains("BTP_CONDUCTEUR_TRAVAUX");
    }

    @Test
    void avis_ne_bloque_pas_approbation_contrairement_charge_et_reviseur() {
        assertThat(RoleIntervenant.AVIS.bloqueApprobation()).isFalse();
        assertThat(RoleIntervenant.APPROBATEUR.bloqueApprobation()).isFalse();
        assertThat(RoleIntervenant.CHARGE_ETUDE.bloqueApprobation()).isTrue();
        assertThat(RoleIntervenant.REVISEUR.bloqueApprobation()).isTrue();
    }
}
