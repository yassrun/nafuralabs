package ma.nafura.etudes.domain.ouvrage;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.UUID;
import org.junit.jupiter.api.Test;
import ma.nafura.etudes.domain.appeloffre.ReferenceType;

class ComposantReferenceTest {

    @Test
    void item_exige_itemId_et_nettoie_ouvrage() {
        UUID itemId = UUID.randomUUID();
        ComposantReference ref = ComposantReference.resolve(
                "ITEM", itemId, UUID.randomUUID(), "Ciment CPJ", null);

        assertThat(ref.type()).isEqualTo(ReferenceType.ITEM);
        assertThat(ref.itemId()).isEqualTo(itemId);
        assertThat(ref.ouvrageId()).isNull();
        assertThat(ref.libelle()).isEqualTo("Ciment CPJ");
    }

    @Test
    void ouvrage_exige_ouvrageId() {
        UUID ouvrageId = UUID.randomUUID();
        ComposantReference ref = ComposantReference.resolve(
                "OUVRAGE", null, ouvrageId, "Sous-ouvrage", null);

        assertThat(ref.type()).isEqualTo(ReferenceType.OUVRAGE);
        assertThat(ref.ouvrageId()).isEqualTo(ouvrageId);
        assertThat(ref.itemId()).isNull();
    }

    @Test
    void libre_refuse_ids() {
        ComposantReference ref = ComposantReference.resolve(
                "LIBRE", UUID.randomUUID(), UUID.randomUUID(), "Aléas", null);

        assertThat(ref.type()).isEqualTo(ReferenceType.LIBRE);
        assertThat(ref.itemId()).isNull();
        assertThat(ref.ouvrageId()).isNull();
        assertThat(ref.libelle()).isEqualTo("Aléas");
    }

    @Test
    void legacy_articleOuPosteId_devient_libre() {
        ComposantReference ref = ComposantReference.resolve(null, null, null, null, "Ciment");

        assertThat(ref.type()).isEqualTo(ReferenceType.LIBRE);
        assertThat(ref.libelle()).isEqualTo("Ciment");
    }

    @Test
    void item_sans_id_echoue() {
        assertThatThrownBy(() -> ComposantReference.resolve("ITEM", null, null, "x", null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("item_id");
    }

    @Test
    void libre_sans_libelle_echoue() {
        assertThatThrownBy(() -> ComposantReference.resolve("LIBRE", null, null, "  ", null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("libelle");
    }
}
