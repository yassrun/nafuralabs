package ma.nafura.catalogue.api;

import ma.nafura.catalogue.domain.NatureComposantMapping;

/** Mapping nature / type ouvrage / type DPU — sans exposer item.domain. */
public final class CatalogNatureMapping {

    public static final String DPU_MATIERE = NatureComposantMapping.DPU_MATIERE;
    public static final String DPU_MAIN_DOEUVRE = NatureComposantMapping.DPU_MAIN_DOEUVRE;
    public static final String DPU_MATERIEL = NatureComposantMapping.DPU_MATERIEL;
    public static final String DPU_SOUS_TRAITANCE = NatureComposantMapping.DPU_SOUS_TRAITANCE;

    private CatalogNatureMapping() {}

    public static String toDpuTypeFromOuvrage(String ouvrageType) {
        return NatureComposantMapping.toDpuTypeFromOuvrage(ouvrageType);
    }

    public static String toOuvrageTypeFromDpu(String dpuType) {
        return NatureComposantMapping.toOuvrageTypeFromDpu(dpuType);
    }

    public static String toDpuTypeFromNature(String natureCode) {
        return NatureComposantMapping.toDpuTypeFromNature(natureCode);
    }
}
