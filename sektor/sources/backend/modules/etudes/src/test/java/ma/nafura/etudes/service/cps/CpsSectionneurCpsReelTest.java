package ma.nafura.etudes.service.cps;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import ma.nafura.etudes.service.cps.CpsSectionneur.SectionBrute;
import org.junit.jupiter.api.Test;

/**
 * Passe le sectionneur sur un CPS reel du depot ({@code cps_exemple.md}).
 *
 * <p>Les tests unitaires voisins portent sur des extraits que j'ai ecrits ; celui-ci porte sur
 * un document que personne n'a fabrique pour l'occasion. C'est lui qui a revele deux motifs
 * manquants ({@code ARTICLE - 1 -} avec tirets, {@code CHAPITRE-I-} sans espace) et le fait
 * qu'une table des matieres, concentrant tous les titres, dominerait la recherche.
 *
 * <p>Ignore si le fichier n'est pas la, pour ne pas casser la CI d'un poste qui ne l'aurait pas.
 */
class CpsSectionneurCpsReelTest {

    private final CpsSectionneur sectionneur = new CpsSectionneur();

    private List<SectionBrute> sectionsDuCpsReel() throws IOException {
        Path fichier = trouverCpsExemple();
        assumeTrue(fichier != null, "cps_exemple.md absent — test ignore");
        return sectionneur.decouper(Files.readString(fichier));
    }

    @Test
    void le_cps_reel_est_decoupe_en_sections_structurees() throws IOException {
        List<SectionBrute> sections = sectionsDuCpsReel();

        assertThat(sections).hasSizeGreaterThan(20);

        long avecNumero = sections.stream().filter(s -> s.numero() != null).count();
        // La quasi-totalite doit etre numerotee : un CPS est un document structure. Si ce
        // ratio s'effondre, c'est que les motifs de titres ne collent plus.
        assertThat(avecNumero)
                .as("sections numerotees sur %d", sections.size())
                .isGreaterThan(sections.size() / 2);
    }

    @Test
    void la_section_technique_du_beton_arme_est_retrouvee_avec_son_numero() throws IOException {
        List<SectionBrute> sections = sectionsDuCpsReel();

        // 1.1.3 dans le CPS = article 1-1-3 du bordereau. C'est cette correspondance qui
        // justifie de ponderer le numero en 'A' dans la recherche plein texte.
        assertThat(sections)
                .filteredOn(s -> "1.1.3".equals(s.numero()))
                .as("section 1.1.3 du CPS reel")
                .isNotEmpty()
                .allSatisfy(s -> assertThat(s.titre()).containsIgnoringCase("BETON ARME"));
    }

    @Test
    void aucune_section_ne_contient_majoritairement_le_sommaire() throws IOException {
        List<SectionBrute> sections = sectionsDuCpsReel();

        // Une table des matieres a la plus forte densite de mots-cles du document : laissee
        // en base, elle remonterait avant les prescriptions techniques sur presque toute requete.
        assertThat(sections).allSatisfy(s -> {
            long lignesSommaire = s.contenu().lines()
                    .filter(l -> !l.isBlank())
                    .filter(l -> l.matches(".*\\.{4,}\\s*\\d+\\s*$"))
                    .count();
            long lignes = s.contenu().lines().filter(l -> !l.isBlank()).count();
            assertThat(lignesSommaire * 2)
                    .as("section « %s » majoritairement sommaire", s.numero())
                    .isLessThanOrEqualTo(lignes);
        });
    }

    @Test
    void les_sections_restent_exploitables_en_taille() throws IOException {
        List<SectionBrute> sections = sectionsDuCpsReel();

        // Une section de 50 000 caracteres signifie qu'on a rate tous les titres d'un chapitre :
        // elle serait renvoyee en entier au modele et couterait cher pour rien.
        assertThat(sections).allSatisfy(s ->
                assertThat(s.contenu().length())
                        .as("taille de la section « %s »", s.numero())
                        .isLessThan(50_000));
    }

    /** Remonte l'arborescence jusqu'a la racine du depot. */
    private static Path trouverCpsExemple() {
        Path courant = Path.of("").toAbsolutePath();
        for (int i = 0; i < 8 && courant != null; i++) {
            Path candidat = courant.resolve("cps_exemple.md");
            if (Files.exists(candidat)) {
                return candidat;
            }
            courant = courant.getParent();
        }
        return null;
    }
}
