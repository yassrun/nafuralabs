package ma.nafura.etudes.service.cps;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import ma.nafura.etudes.service.cps.CpsSectionneur.SectionBrute;
import org.junit.jupiter.api.Test;

/**
 * Le decoupage decide de la qualite de la recherche : une description coupee en deux est
 * introuvable. Ces tests verrouillent le comportement sur les formes de CPS courantes.
 */
class CpsSectionneurTest {

    private final CpsSectionneur sectionneur = new CpsSectionneur();

    @Test
    void decoupe_sur_les_articles_numerotes() {
        String cps = """
                ARTICLE 12 - BETONS
                Les betons seront conformes a la norme NM 10.1.008.
                Le dosage minimal en ciment CPJ 45 est de 400 kg par metre cube.

                ARTICLE 13 - COFFRAGES
                Les coffrages seront en bois de qualite courante, huiles avant coulage.
                Le nombre de reemplois ne depassera pas six.
                """;

        List<SectionBrute> sections = sectionneur.decouper(cps);

        assertThat(sections).hasSize(2);
        assertThat(sections.get(0).numero()).isEqualTo("12");
        assertThat(sections.get(0).titre()).isEqualTo("BETONS");
        assertThat(sections.get(0).contenu()).contains("400 kg");
        assertThat(sections.get(1).numero()).isEqualTo("13");
        assertThat(sections.get(1).titre()).isEqualTo("COFFRAGES");
        // La description du coffrage n'est pas coupee : elle est entiere dans sa section.
        assertThat(sections.get(1).contenu()).contains("six");
    }

    @Test
    void decoupe_sur_la_numerotation_hierarchique() {
        String cps = """
                3.2.1 Betons pour ouvrages en infrastructure
                Dosage 400 kg/m3 de CPJ 45. Granulats 0/4 et 4/20 conformes aux specifications.

                3.2.2 Betons pour ouvrages en elevation
                Meme dosage, avec adjuvant plastifiant selon prescriptions du laboratoire.
                """;

        List<SectionBrute> sections = sectionneur.decouper(cps);

        assertThat(sections).hasSize(2);
        assertThat(sections).extracting(SectionBrute::numero)
                .containsExactly("3.2.1", "3.2.2");
        assertThat(sections.get(1).titre()).isEqualTo("Betons pour ouvrages en elevation");
    }

    @Test
    void reconnait_les_chapitres() {
        String cps = """
                CHAPITRE IV - PRESCRIPTIONS TECHNIQUES
                Le present chapitre fixe les prescriptions applicables a l'ensemble des ouvrages
                du present marche, sans prejudice des articles particuliers.
                """;

        List<SectionBrute> sections = sectionneur.decouper(cps);

        assertThat(sections).hasSize(1);
        assertThat(sections.get(0).numero()).isEqualTo("IV");
        assertThat(sections.get(0).titre()).isEqualTo("PRESCRIPTIONS TECHNIQUES");
    }

    @Test
    void une_liste_numerotee_simple_n_est_pas_un_titre() {
        // « 1. » suivi de texte est une puce, pas une section. Sans cette regle, chaque
        // enumeration d'un CPS produirait des dizaines de fausses sections.
        String cps = """
                ARTICLE 5 - CONSISTANCE DES TRAVAUX
                Les travaux comprennent notamment :
                1. la preparation du terrain et les installations de chantier
                2. les terrassements en deblai et en remblai
                3. les ouvrages en beton arme
                """;

        List<SectionBrute> sections = sectionneur.decouper(cps);

        assertThat(sections).hasSize(1);
        assertThat(sections.get(0).contenu()).contains("terrassements");
    }

    @Test
    void un_sommaire_ne_produit_pas_de_sections_vides() {
        // Titres qui s'enchainent sans contenu : typique d'une table des matieres.
        String cps = """
                ARTICLE 12 - BETONS
                ARTICLE 13 - COFFRAGES
                ARTICLE 14 - ACIERS
                ARTICLE 15 - MACONNERIE
                Les maconneries seront executees en agglomeres de ciment de 20 centimetres,
                hourdes au mortier de ciment dose a 350 kg.
                """;

        List<SectionBrute> sections = sectionneur.decouper(cps);

        assertThat(sections).hasSize(1);
        assertThat(sections.get(0).numero()).isEqualTo("15");
    }

    @Test
    void sans_structure_detectable_on_replie_sur_des_blocs_avec_recouvrement() {
        String texte = "Prescriptions techniques diverses. ".repeat(200);

        List<SectionBrute> sections = sectionneur.decouper(texte);

        assertThat(sections).hasSizeGreaterThan(1);
        assertThat(sections).allSatisfy(s -> {
            assertThat(s.numero()).isNull();
            assertThat(s.contenu()).isNotBlank();
        });
        // Le recouvrement garantit qu'une phrase a cheval reste entiere quelque part.
        String reconstitue = String.join(" ", sections.stream().map(SectionBrute::contenu).toList());
        assertThat(reconstitue.length()).isGreaterThan(texte.strip().length());
    }

    @Test
    void texte_vide_ou_null_ne_casse_pas() {
        assertThat(sectionneur.decouper(null)).isEmpty();
        assertThat(sectionneur.decouper("")).isEmpty();
        assertThat(sectionneur.decouper("   \n  ")).isEmpty();
    }

    @Test
    void l_ordre_du_document_est_preserve() {
        String cps = """
                ARTICLE 1 - OBJET
                Le present marche a pour objet la construction d'un batiment administratif.

                ARTICLE 2 - CONSISTANCE
                Les travaux comprennent le gros oeuvre et les corps d'etat secondaires.

                ARTICLE 3 - DELAIS
                Le delai global d'execution est fixe a douze mois a compter de l'ordre de service.
                """;

        List<SectionBrute> sections = sectionneur.decouper(cps);

        assertThat(sections).extracting(SectionBrute::ordre).containsExactly(0, 1, 2);
        assertThat(sections).extracting(SectionBrute::numero).containsExactly("1", "2", "3");
    }
}
