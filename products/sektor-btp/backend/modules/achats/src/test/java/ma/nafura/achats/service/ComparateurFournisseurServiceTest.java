package ma.nafura.achats.service;

import static org.junit.jupiter.api.Assertions.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import ma.nafura.achats.api.dto.ComparateurOffreDto;
import org.junit.jupiter.api.Test;

class ComparateurFournisseurServiceTest {

    @Test
    void tri_28_avant_30_scenarioReference() {
        ComparateurOffreDto jotun = offre("Jotun", "28.00", 5);
        ComparateurOffreDto tollens = offre("Tollens", "30.00", 2);
        ComparateurOffreDto colorado = offre("Colorado", "31.00", 12);

        List<ComparateurOffreDto> sorted = List.of(tollens, colorado, jotun).stream()
                .sorted(ComparateurFournisseurService.comparateurOrder())
                .toList();

        assertEquals("Jotun", sorted.get(0).getDesignation());
        assertEquals("Tollens", sorted.get(1).getDesignation());
        assertEquals("Colorado", sorted.get(2).getDesignation());
        assertEquals(0, new BigDecimal("28.00").compareTo(sorted.get(0).getPrixNormalise()));
    }

    @Test
    void formatConditionnement_pot15L() {
        assertEquals("15 L", ComparateurFournisseurService.formatConditionnement(new BigDecimal("15"), "L"));
        assertEquals("20", ComparateurFournisseurService.formatConditionnement(new BigDecimal("20"), null));
        assertNull(ComparateurFournisseurService.formatConditionnement(null, null));
    }

    @Test
    void nullPrixNormalise_enFin() {
        ComparateurOffreDto with = offre("A", "10", 1);
        ComparateurOffreDto without = offre("B", null, 1);
        List<ComparateurOffreDto> sorted = List.of(without, with).stream()
                .sorted(ComparateurFournisseurService.comparateurOrder())
                .toList();
        assertEquals("A", sorted.get(0).getDesignation());
        assertEquals("B", sorted.get(1).getDesignation());
    }

    private static ComparateurOffreDto offre(String designation, String prixNorm, Integer delai) {
        return ComparateurOffreDto.builder()
                .ligneId(UUID.randomUUID())
                .designation(designation)
                .prixNormalise(prixNorm != null ? new BigDecimal(prixNorm) : null)
                .delaiJours(delai)
                .build();
    }
}
