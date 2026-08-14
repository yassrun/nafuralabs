package ma.nafura.catalogue.service;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class CatalogSlugTest {

    @Test
    void slugifieLibelle() {
        assertThat(CatalogSlug.from("Peinture acrylique intérieure"))
                .isEqualTo("peinture-acrylique-interieure");
    }
}
