package ma.nafura.etudes.service;

import static org.junit.jupiter.api.Assertions.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import ma.nafura.etudes.api.dto.RattrapageGroupeDto;
import ma.nafura.etudes.domain.dpu.ComposantDpu;
import ma.nafura.etudes.domain.dpu.PrixDpu;
import org.junit.jupiter.api.Test;

class RattrapageComposantServiceTest {

    @Test
    void grouper_regroupeLibellesSimilaires() {
        UUID noeud = UUID.randomUUID();
        PrixDpu prix = PrixDpu.builder().dpgfNoeudId(noeud).build();
        List<ComposantDpu> libres = List.of(
                libre(prix, "Ciment CPJ 45"),
                libre(prix, " ciment  cpj  45 "),
                libre(prix, "Sable de dune"),
                libre(prix, "Amenée et repli"));

        List<RattrapageGroupeDto> groupes = RattrapageComposantService.grouper(libres);

        assertEquals(3, groupes.size());
        RattrapageGroupeDto ciment = groupes.stream()
                .filter(g -> g.getLibelleNormalise().equals("ciment cpj 45"))
                .findFirst()
                .orElseThrow();
        assertEquals(2, ciment.getCount());
        assertEquals(2, ciment.getComposantIds().size());
    }

    @Test
    void normalize_collapseSpacesAndCase() {
        assertEquals("ciment cpj 45", RattrapageComposantService.normalizeLibelle("  Ciment   CPJ 45 "));
        assertEquals("", RattrapageComposantService.normalizeLibelle(null));
    }

    private static ComposantDpu libre(PrixDpu prix, String libelle) {
        return ComposantDpu.builder()
                .id(UUID.randomUUID())
                .prixDpu(prix)
                .referenceType("LIBRE")
                .libelle(libelle)
                .horsReferentiel(false)
                .rendement(BigDecimal.ONE)
                .unite("T")
                .prixUnitaire(BigDecimal.TEN)
                .total(BigDecimal.TEN)
                .build();
    }
}
