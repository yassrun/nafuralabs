package ma.nafura.item.domain;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;

class NatureComposantMappingTest {

    @Test
    void mapOuvrageToDpu_alignWithLegacyDpuService() {
        assertEquals(NatureComposantMapping.DPU_MAIN_DOEUVRE, NatureComposantMapping.toDpuTypeFromOuvrage("MO"));
        assertEquals(NatureComposantMapping.DPU_MATERIEL, NatureComposantMapping.toDpuTypeFromOuvrage("LOCATION"));
        assertEquals(NatureComposantMapping.DPU_MATERIEL, NatureComposantMapping.toDpuTypeFromOuvrage("OUTILLAGE"));
        assertEquals(
                NatureComposantMapping.DPU_SOUS_TRAITANCE,
                NatureComposantMapping.toDpuTypeFromOuvrage("SOUS_TRAITANCE"));
        assertEquals(NatureComposantMapping.DPU_MATIERE, NatureComposantMapping.toDpuTypeFromOuvrage("MATERIAU"));
        assertEquals(NatureComposantMapping.DPU_MATIERE, NatureComposantMapping.toDpuTypeFromOuvrage(null));
    }

    @Test
    void articleTypeNormalizeLegacy() {
        assertEquals(ArticleType.MATIERE, ArticleType.normalize("MATERIAU"));
        assertEquals(ArticleType.MAIN_DOEUVRE, ArticleType.normalize("main_doeuvre"));
    }
}
