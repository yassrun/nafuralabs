package ma.nafura.etudes.service.cps;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.stereotype.Component;

/**
 * Decoupe le texte d'un CPS en sections exploitables.
 *
 * <p>C'est la piece qui decide de la qualite de tout l'aval. Un decoupage arbitraire tous les
 * N caracteres coupe une description de beton en deux et la rend inutilisable ; un decoupage
 * qui suit la structure du document rend chaque section autonome.
 *
 * <p>Un CPS est structure : « ARTICLE 12 - BETONS », « 3.2.1 Betons pour infrastructure ».
 * On detecte ces titres et on decoupe dessus. Quand le document n'a aucune structure
 * detectable — scan mediocre, mise en page exotique — on retombe sur un decoupage par taille
 * avec recouvrement, qui degrade la precision mais ne perd rien.
 */
@Component
public class CpsSectionneur {

    /**
     * « ARTICLE 12 », « ARTICLE - 12 - TITRE », « Article 12 : ... ».
     *
     * <p>Le separateur avant le numero est optionnel : les CPS reels ecrivent couramment
     * {@code ARTICLE - 1 - OBJET DU MARCHE}, forme qu'un {@code \\s+} seul ne reconnait pas.
     */
    private static final Pattern TITRE_ARTICLE =
            Pattern.compile("^\\s*ARTICLE\\s*[-–—]?\\s*(\\d+(?:\\.\\d+)*)\\s*[-–—:.]?\\s*(.*)$",
                    Pattern.CASE_INSENSITIVE);

    /** « 3.2.1 Titre », « 15.1. Titre ». Au moins un point pour eviter les listes « 1- ». */
    private static final Pattern TITRE_NUMEROTE =
            Pattern.compile("^\\s*(\\d+(?:\\.\\d+)+)\\.?\\s*[-–—:]?\\s+(\\S.*)$");

    /** « CHAPITRE IV - ... », « CHAPITRE-I- ... » — sans espace, comme dans les CPS reels. */
    private static final Pattern TITRE_CHAPITRE =
            Pattern.compile("^\\s*CHAPITRE\\s*[-–—]?\\s*([IVXLC]+|\\d+)\\s*[-–—:.]?\\s*(.*)$",
                    Pattern.CASE_INSENSITIVE);

    /**
     * Entree de sommaire : points de conduite suivis d'un numero de page.
     *
     * <p>Un CPS reel commence par une table des matieres dont chaque ligne a la meme forme
     * qu'un vrai titre. Sans cette exclusion, le sommaire produirait un doublon de toutes les
     * sections, vides de contenu, qui polluerait la recherche.
     */
    private static final Pattern LIGNE_SOMMAIRE =
            Pattern.compile(".*\\.{4,}\\s*\\d+\\s*$");

    /** En dessous, un « titre » isole n'est probablement qu'un numero de page ou un artefact. */
    private static final int LONGUEUR_MIN_SECTION = 40;

    /** Repli sans structure : taille de bloc et recouvrement, en caracteres. */
    static final int TAILLE_BLOC_REPLI = 2000;
    static final int RECOUVREMENT_REPLI = 200;

    public record SectionBrute(String numero, String titre, String contenu, int ordre) {}

    /**
     * @param texte texte integral du CPS, lignes separees par {@code \n}
     * @return sections dans l'ordre du document ; jamais vide si le texte ne l'est pas
     */
    public List<SectionBrute> decouper(String texte) {
        if (texte == null || texte.isBlank()) {
            return List.of();
        }
        List<SectionBrute> parTitres = decouperParTitres(texte);
        // Le critere est « un titre a-t-il ete reconnu », pas « combien de sections » :
        // un document structure peut n'avoir qu'une seule section, et la compter comme
        // non structuree la priverait de son numero.
        boolean structureDetectee = parTitres.stream().anyMatch(s -> s.numero() != null);
        return structureDetectee ? parTitres : decouperParTaille(texte);
    }

    private List<SectionBrute> decouperParTitres(String texte) {
        List<SectionBrute> sections = new ArrayList<>();
        String[] lignes = texte.split("\\R");

        String numeroCourant = null;
        String titreCourant = null;
        StringBuilder contenu = new StringBuilder();
        int ordre = 0;

        for (String ligne : lignes) {
            String[] titre = detecterTitre(ligne);
            if (titre != null) {
                ordre = ajouterSiUtile(sections, numeroCourant, titreCourant, contenu, ordre);
                numeroCourant = titre[0];
                titreCourant = titre[1].isBlank() ? null : titre[1].trim();
                contenu = new StringBuilder();
            } else {
                contenu.append(ligne).append('\n');
            }
        }
        ajouterSiUtile(sections, numeroCourant, titreCourant, contenu, ordre);
        return sections;
    }

    /** @return {numero, titre} si la ligne est un titre, {@code null} sinon */
    private String[] detecterTitre(String ligne) {
        // Une entree de sommaire a la forme d'un titre mais n'en est pas un.
        if (LIGNE_SOMMAIRE.matcher(ligne).matches()) {
            return null;
        }
        for (Pattern p : List.of(TITRE_ARTICLE, TITRE_CHAPITRE, TITRE_NUMEROTE)) {
            Matcher m = p.matcher(ligne);
            if (m.matches()) {
                return new String[] {m.group(1), m.group(2) == null ? "" : m.group(2)};
            }
        }
        return null;
    }

    /**
     * N'ajoute que les sections qui portent du contenu. Un titre suivi immediatement d'un autre
     * titre (sommaire, faux positif) ne produit rien.
     */
    private int ajouterSiUtile(
            List<SectionBrute> sections, String numero, String titre, StringBuilder contenu, int ordre) {
        String texte = contenu.toString().trim();
        if (texte.isEmpty()) {
            return ordre;
        }
        if (texte.length() < LONGUEUR_MIN_SECTION && numero == null) {
            return ordre;
        }
        // Une table des matieres concentre TOUS les titres du document : c'est la plus forte
        // densite de mots-cles du CPS, et elle dominerait les resultats de recherche en
        // renvoyant systematiquement le sommaire plutot que la prescription technique.
        if (estMajoritairementSommaire(texte)) {
            return ordre;
        }
        sections.add(new SectionBrute(numero, titre, texte, ordre));
        return ordre + 1;
    }

    /** Plus de la moitie des lignes sont des entrees de sommaire : le bloc n'est pas du contenu. */
    private boolean estMajoritairementSommaire(String texte) {
        String[] lignes = texte.split("\\R");
        long sommaire = java.util.Arrays.stream(lignes)
                .filter(l -> !l.isBlank())
                .filter(l -> LIGNE_SOMMAIRE.matcher(l).matches())
                .count();
        long utiles = java.util.Arrays.stream(lignes).filter(l -> !l.isBlank()).count();
        return utiles > 0 && sommaire * 2 > utiles;
    }

    /**
     * Repli sans structure : blocs de taille fixe avec recouvrement.
     *
     * <p>Le recouvrement evite qu'une description coupee net entre deux blocs devienne
     * introuvable — elle reste entiere dans l'un des deux.
     *
     * <p>On coupe de preference sur une fin de phrase proche de la limite, pour ne pas trancher
     * au milieu d'un mot.
     */
    private List<SectionBrute> decouperParTaille(String texte) {
        List<SectionBrute> sections = new ArrayList<>();
        String propre = texte.strip();
        int debut = 0;
        int ordre = 0;

        while (debut < propre.length()) {
            int finVisee = Math.min(debut + TAILLE_BLOC_REPLI, propre.length());
            int fin = finVisee;
            if (finVisee < propre.length()) {
                int point = propre.lastIndexOf('.', finVisee);
                if (point > debut + TAILLE_BLOC_REPLI / 2) {
                    fin = point + 1;
                }
            }
            String bloc = propre.substring(debut, fin).trim();
            if (!bloc.isEmpty()) {
                sections.add(new SectionBrute(null, null, bloc, ordre++));
            }
            if (fin >= propre.length()) {
                break;
            }
            debut = Math.max(fin - RECOUVREMENT_REPLI, debut + 1);
        }
        return sections;
    }
}
