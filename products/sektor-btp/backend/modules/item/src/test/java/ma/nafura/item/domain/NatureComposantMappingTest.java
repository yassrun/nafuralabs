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
    void mapNatureToDpu_allNineNatures() {
        assertEquals(NatureComposantMapping.DPU_MATIERE, NatureComposantMapping.toDpuTypeFromNature("MATIERE"));
        assertEquals(NatureComposantMapping.DPU_MATIERE, NatureComposantMapping.toDpuTypeFromNature("CONSOMMABLE"));
        assertEquals(NatureComposantMapping.DPU_MATIERE, NatureComposantMapping.toDpuTypeFromNature("CARBURANT"));
        assertEquals(NatureComposantMapping.DPU_MATERIEL, NatureComposantMapping.toDpuTypeFromNature("OUTILLAGE"));
        assertEquals(NatureComposantMapping.DPU_MATERIEL, NatureComposantMapping.toDpuTypeFromNature("MATERIEL"));
        assertEquals(NatureComposantMapping.DPU_MATERIEL, NatureComposantMapping.toDpuTypeFromNature("LOCATION"));
        assertEquals(NatureComposantMapping.DPU_MAIN_DOEUVRE, NatureComposantMapping.toDpuTypeFromNature("MAIN_DOEUVRE"));
        assertEquals(
                NatureComposantMapping.DPU_SOUS_TRAITANCE,
                NatureComposantMapping.toDpuTypeFromNature("SOUS_TRAITANCE"));
        assertEquals(
                NatureComposantMapping.DPU_SOUS_TRAITANCE,
                NatureComposantMapping.toDpuTypeFromNature("SERVICE"));
        assertEquals(NatureComposantMapping.DPU_MATIERE, NatureComposantMapping.toDpuTypeFromNature(null));
    }

    @Test
    void mapOuvrageToNature_preservesLocationAndOutillage() {
        assertEquals(Nature.LOCATION.name(), NatureComposantMapping.toNatureFromOuvrage("LOCATION"));
        assertEquals(Nature.OUTILLAGE.name(), NatureComposantMapping.toNatureFromOuvrage("OUTILLAGE"));
        assertEquals(Nature.MAIN_DOEUVRE.name(), NatureComposantMapping.toNatureFromOuvrage("MO"));
        assertEquals(Nature.MATIERE.name(), NatureComposantMapping.toNatureFromOuvrage("MATERIAU"));
    }

    @Test
    void fromLegacy_materiauAndCase() {
        assertEquals(Nature.MATIERE, Nature.fromLegacy("MATERIAU"));
        assertEquals(Nature.MAIN_DOEUVRE, Nature.fromLegacy("main_doeuvre"));
        assertNull(Nature.fromLegacy(null));
        assertNull(Nature.fromLegacy("  "));
    }

    @Test
    void fromLegacy_rejectsUnknown() {
        assertThrows(IllegalArgumentException.class, () -> Nature.fromLegacy("ENGIN"));
        assertThrows(IllegalArgumentException.class, () -> Nature.fromLegacy("PRESTATION"));
    }

    @Test
    void toOuvrageTypeFromDpu() {
        assertEquals(NatureComposantMapping.OUVRAGE_MO, NatureComposantMapping.toOuvrageTypeFromDpu("MAIN_DOEUVRE"));
        assertEquals(NatureComposantMapping.OUVRAGE_LOCATION, NatureComposantMapping.toOuvrageTypeFromDpu("MATERIEL"));
        assertEquals(
                NatureComposantMapping.OUVRAGE_SOUS_TRAITANCE,
                NatureComposantMapping.toOuvrageTypeFromDpu("SOUS_TRAITANCE"));
        assertEquals(NatureComposantMapping.OUVRAGE_MATERIAU, NatureComposantMapping.toOuvrageTypeFromDpu("MATIERE"));
    }

    @Test
    void natureAttributes_matchPlan() {
        assertTrue(Nature.OUTILLAGE.isStockable());
        assertTrue(Nature.OUTILLAGE.isValorise());
        assertFalse(Nature.MATERIEL.isStockable());
        assertEquals("FRAIS_GENERAUX", Nature.SERVICE.getPosteBudgetDefaut());
        assertEquals("SOUS_TRAITANCE", Nature.SERVICE.getTypeDpu());
        assertEquals(9, Nature.all().size());
    }
}
