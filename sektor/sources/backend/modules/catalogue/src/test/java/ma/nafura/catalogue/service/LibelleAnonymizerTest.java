package ma.nafura.catalogue.service;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class LibelleAnonymizerTest {

    @Test
    void retireEmailTelephoneUuid() {
        String out = LibelleAnonymizer.anonymiser(
                "Peinture blanche contact@acme.ma +212612345678 id=aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
        assertThat(out).doesNotContain("@").doesNotContain("212").doesNotContain("aaaaaaaa");
        assertThat(out).contains("peinture").contains("blanche");
    }

    @Test
    void cleRegroupement_stable() {
        assertThat(LibelleAnonymizer.cleRegroupement("Peinture Blanche"))
                .isEqualTo(LibelleAnonymizer.cleRegroupement("peinture blanche"));
    }
}
