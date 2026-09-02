package ma.nafura.etudes.service.gate;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import ma.nafura.etudes.domain.dpu.ComposantDpu;
import ma.nafura.etudes.domain.dossier.DossierEtude;
import ma.nafura.etudes.domain.dpgf.DpgfNoeud;
import ma.nafura.etudes.domain.dpu.PrixDpu;
import ma.nafura.etudes.repository.PrixDpuRepository;
import ma.nafura.etudes.service.gate.ResultatGate.ProblemeGate;
import org.springframework.stereotype.Component;

/**
 * Les cinq règles d'étape, regroupées ici pour qu'on puisse les lire d'un bloc.
 *
 * <p>Chacune est une classe distincte implémentant {@link EtapeGate} ; le regroupement dans
 * un fichier est un choix de lisibilité, pas de couplage.
 */
public final class GatesEtude {

    private GatesEtude() {}

    private static ProblemeGate probleme(DpgfNoeud n, String message) {
        return new ProblemeGate(n.getId(), n.getCode(), n.getLibelle(), message);
    }

    private static boolean estArticle(DpgfNoeud n) {
        return DpgfNoeud.TYPE_ARTICLE.equals(n.getType());
    }

    /**
     * Étape 1 — cadrage. CPS, BDP et pièces de destination (caution, plans…)
     * sont optionnels : le cadrage n'attend pas de PDF pour avancer (AC-4).
     * L'arbre bordereau reste exigé à l'étape 2.
     */
    @Component
    public static class GateDocuments implements EtapeGate {
        @Override
        public int etape() {
            return DossierEtude.ETAPE_DOCUMENTS;
        }

        @Override
        public ResultatGate evaluer(ContexteGate contexte) {
            return ResultatGate.ok(etape());
        }
    }

    /** Étape 2 — le bordereau existe et ses articles sont exploitables. */
    @Component
    public static class GateBordereau implements EtapeGate {
        @Override
        public int etape() {
            return DossierEtude.ETAPE_BORDEREAU;
        }

        @Override
        public ResultatGate evaluer(ContexteGate contexte) {
            List<DpgfNoeud> articles = contexte.articles();
            if (articles.isEmpty()) {
                return new ResultatGate(etape(), true, List.of(new ProblemeGate(
                        null, null, null, "etudes.gate.bordereau.aucun_article")));
            }
            List<ProblemeGate> pbs = new ArrayList<>();
            for (DpgfNoeud a : articles) {
                if (a.getUnite() == null || a.getUnite().isBlank()) {
                    pbs.add(probleme(a, "etudes.gate.bordereau.unite_manquante"));
                } else if (a.getQuantite() == null
                        || a.getQuantite().compareTo(BigDecimal.ZERO) <= 0) {
                    pbs.add(probleme(a, "etudes.gate.bordereau.quantite_invalide"));
                }
            }
            pbs.addAll(lotsSansArticle(contexte.noeuds()));
            pbs.addAll(codesArticlesDupliques(articles));
            return new ResultatGate(etape(), true, pbs);
        }

        /** Lot / sous-lot sans aucun article descendant. */
        private static List<ProblemeGate> lotsSansArticle(List<DpgfNoeud> noeuds) {
            if (noeuds == null || noeuds.isEmpty()) {
                return List.of();
            }
            Map<UUID, DpgfNoeud> byId = new HashMap<>();
            for (DpgfNoeud n : noeuds) {
                if (n.getId() != null) {
                    byId.put(n.getId(), n);
                }
            }
            Set<UUID> parentsAvecArticle = new HashSet<>();
            for (DpgfNoeud a : noeuds) {
                if (!DpgfNoeud.TYPE_ARTICLE.equals(a.getType())) {
                    continue;
                }
                UUID p = a.getParentId();
                while (p != null) {
                    if (!parentsAvecArticle.add(p)) {
                        break;
                    }
                    DpgfNoeud parent = byId.get(p);
                    p = parent != null ? parent.getParentId() : null;
                }
            }
            List<ProblemeGate> pbs = new ArrayList<>();
            for (DpgfNoeud n : noeuds) {
                if (!DpgfNoeud.TYPE_LOT.equals(n.getType())
                        && !DpgfNoeud.TYPE_SOUS_LOT.equals(n.getType())) {
                    continue;
                }
                if (!parentsAvecArticle.contains(n.getId())) {
                    pbs.add(probleme(n, "etudes.gate.bordereau.lot_vide"));
                }
            }
            return pbs;
        }

        private static List<ProblemeGate> codesArticlesDupliques(List<DpgfNoeud> articles) {
            Map<String, List<DpgfNoeud>> byCode = new HashMap<>();
            for (DpgfNoeud a : articles) {
                if (a.getCode() == null || a.getCode().isBlank()) {
                    continue;
                }
                String key = a.getCode().trim().toUpperCase(Locale.ROOT);
                // Bruit OCR / marqueurs de liste (a), 1, a, b.) — pas des codes métier.
                if (estCodeArticleTrivial(key)) {
                    continue;
                }
                byCode.computeIfAbsent(key, k -> new ArrayList<>()).add(a);
            }
            List<ProblemeGate> pbs = new ArrayList<>();
            for (List<DpgfNoeud> group : byCode.values()) {
                if (group.size() < 2) {
                    continue;
                }
                for (DpgfNoeud a : group) {
                    pbs.add(probleme(a, "etudes.gate.bordereau.code_duplique"));
                }
            }
            return pbs;
        }

        /**
         * Codes trop courts / purement alphabétiques avec ponctuation de liste —
         * exclus de la gate doublon (sinon BDP scannés bloquent massivement).
         */
        static boolean estCodeArticleTrivial(String codeUpper) {
            if (codeUpper == null || codeUpper.isBlank()) {
                return true;
            }
            String compact = codeUpper.replaceAll("[\\s.)$]", "");
            if (compact.isEmpty()) {
                return true;
            }
            // Une seule lettre (A, B) ou chiffre (1, 12) sans séparateur métier.
            if (compact.matches("[A-Z]") || compact.matches("\\d{1,2}")) {
                return true;
            }
            // Marqueurs de liste du type "A)" déjà normalisés, ou "I", "II" romains courts.
            if (compact.matches("I{1,3}|IV|VI{0,3}|IX|X")) {
                return true;
            }
            return false;
        }
    }

    /** Étape 3 — chaque article a une origine de coût et un coût unitaire > 0.
     * DECOMPOSE exige en plus des composants à rendement utile. */
    @Component
    public static class GateDecomposition implements EtapeGate {

        private final PrixDpuRepository prixDpuRepository;

        public GateDecomposition(PrixDpuRepository prixDpuRepository) {
            this.prixDpuRepository = prixDpuRepository;
        }

        @Override
        public int etape() {
            return DossierEtude.ETAPE_DECOMPOSITION;
        }

        @Override
        public ResultatGate evaluer(ContexteGate contexte) {
            List<DpgfNoeud> articles = contexte.articles();
            List<ProblemeGate> pbs = new ArrayList<>();
            for (DpgfNoeud a : articles) {
                if (a.getOrigineCout() == null || a.getOrigineCout().isBlank()) {
                    pbs.add(probleme(a, "etudes.gate.cout.origine_manquante"));
                    continue;
                }
                if (a.getCoutUnitaire() == null || a.getCoutUnitaire().compareTo(BigDecimal.ZERO) <= 0) {
                    pbs.add(probleme(a, "etudes.gate.cout.cout_unitaire_manquant"));
                    continue;
                }
                if (!"DECOMPOSE".equals(a.getOrigineCout())) {
                    continue;
                }
                if (a.getPrixDpuId() == null) {
                    pbs.add(probleme(a, "etudes.gate.decomposition.absente"));
                    continue;
                }
                PrixDpu dpu = prixDpuRepository.findById(a.getPrixDpuId()).orElse(null);
                if (dpu == null || dpu.getComposants() == null || dpu.getComposants().isEmpty()) {
                    pbs.add(probleme(a, "etudes.gate.decomposition.aucun_composant"));
                    continue;
                }
                boolean rendementUtile = dpu.getComposants().stream()
                        .map(ComposantDpu::getRendement)
                        .anyMatch(r -> r != null && r.compareTo(BigDecimal.ZERO) > 0);
                if (!rendementUtile) {
                    pbs.add(probleme(a, "etudes.gate.decomposition.rendements_nuls"));
                }
            }
            return new ResultatGate(etape(), true, pbs);
        }
    }

    /**
     * Étape 4 — consultation fournisseurs. Compteur = devis consultation reçus
     * (fournisseurs distincts). {@code sourcePrix=CONSULTE} n'est plus une preuve.
     * Optionnelle (défaut) = informative. Obligatoire = bloquante tant que recus &lt; min N.
     */
    @Component
    public static class GateConsultationFournisseurs implements EtapeGate {

        @Override
        public int etape() {
            return DossierEtude.ETAPE_CONSULTATION_FOURNISSEURS;
        }

        @Override
        public boolean bloquant() {
            return false;
        }

        @Override
        public ResultatGate evaluer(ContexteGate contexte) {
            boolean obligatoire = contexte.consultationObligatoire();
            int min = Math.max(1, contexte.consultationMinimum());
            long recus = Math.max(0L, contexte.devisConsultationRecus());
            if (!obligatoire) {
                List<ProblemeGate> infos = new ArrayList<>();
                if (recus == 0) {
                    infos.add(new ProblemeGate(
                            null, null, null, "etudes.gate.consultation.informative"));
                }
                return new ResultatGate(etape(), false, infos);
            }
            if (recus < min) {
                return new ResultatGate(
                        etape(),
                        true,
                        List.of(new ProblemeGate(
                                null, null, null, "etudes.gate.consultation.min_devis")));
            }
            return ResultatGate.ok(etape());
        }
    }

    /**
     * Étape 5 — chiffrage : FG/marge partout. Coûts estimés + avis OUVERT/ECARTE sont
     * informatifs (non bloquants). Prix / taux manquants restent bloquants.
     */
    @Component
    public static class GateChiffrage implements EtapeGate {

        @Override
        public int etape() {
            return DossierEtude.ETAPE_CHIFFRAGE;
        }

        @Override
        public ResultatGate evaluer(ContexteGate contexte) {
            List<DpgfNoeud> articles = contexte.articles();
            List<ProblemeGate> bloquants = new ArrayList<>();
            List<ProblemeGate> infos = new ArrayList<>();
            BigDecimal montantTotal = BigDecimal.ZERO;
            BigDecimal montantEstime = BigDecimal.ZERO;
            for (DpgfNoeud a : articles) {
                if (a.getPrixUnitaire() == null
                        || a.getPrixUnitaire().compareTo(BigDecimal.ZERO) <= 0) {
                    bloquants.add(probleme(a, "etudes.gate.chiffrage.prix_absent"));
                    continue;
                }
                if (a.getFraisGenerauxPercent() == null || a.getMargePercent() == null) {
                    bloquants.add(probleme(a, "etudes.gate.chiffrage.taux_manquants"));
                }
                BigDecimal ligne = a.getTotal() != null
                        ? a.getTotal()
                        : (a.getQuantite() != null
                                ? a.getQuantite().multiply(a.getPrixUnitaire())
                                : a.getPrixUnitaire());
                if (ligne != null) {
                    montantTotal = montantTotal.add(ligne);
                    if ("ESTIME".equals(a.getOrigineCout()) || Boolean.TRUE.equals(a.getCoutDeduit())) {
                        montantEstime = montantEstime.add(ligne);
                    }
                }
            }
            if (montantTotal.compareTo(BigDecimal.ZERO) > 0
                    && montantEstime.compareTo(BigDecimal.ZERO) > 0) {
                infos.add(new ProblemeGate(
                        null,
                        null,
                        null,
                        "etudes.gate.chiffrage.part_couts_estimes"));
            }
            if (contexte.avisOuverts() > 0) {
                infos.add(new ProblemeGate(
                        null, null, null, "etudes.gate.chiffrage.avis_ouverts"));
            }
            if (contexte.avisEcartes() > 0) {
                infos.add(new ProblemeGate(
                        null, null, null, "etudes.gate.chiffrage.avis_ecartes"));
            }
            List<ProblemeGate> pbs = new ArrayList<>(bloquants);
            pbs.addAll(infos);
            return new ResultatGate(etape(), !bloquants.isEmpty(), pbs);
        }
    }
}
