package ma.nafura.etudes.service.gate;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import ma.nafura.etudes.domain.model.ComposantDpu;
import ma.nafura.etudes.domain.model.DossierEtude;
import ma.nafura.etudes.domain.model.DpgfNoeud;
import ma.nafura.etudes.domain.model.PrixDpu;
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
     * Étape 1 — les pièces du marché sont déposées.
     *
     * <p>Le CPS entre ici, pas à une étape dédiée : il est ensuite découpé en sections et
     * interrogé à la demande pendant la décomposition, au moment où le descriptif sert.
     */
    @Component
    public static class GateDocuments implements EtapeGate {
        @Override
        public int etape() {
            return DossierEtude.ETAPE_DOCUMENTS;
        }

        @Override
        public ResultatGate evaluer(ContexteGate contexte) {
            if (contexte.nombreDocuments() <= 0) {
                return new ResultatGate(etape(), true, List.of(new ProblemeGate(
                        null, null, null, "etudes.gate.documents.aucune_piece")));
            }
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
            return new ResultatGate(etape(), true, pbs);
        }
    }

    /** Étape 3 — chaque article est FOURNI, ou DECOMPOSE avec au moins un composant utile. */
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
                if (DpgfNoeud.MODE_FOURNI.equals(a.getMode())) {
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
     * Étape 4 — consultation fournisseurs. <b>Non bloquante</b> : le taux de couverture des
     * prix consultés remonte dans le dossier de validation, pour que l'approbateur sache sur
     * quoi il s'engage.
     */
    @Component
    public static class GateConsultationFournisseurs implements EtapeGate {

        private final PrixDpuRepository prixDpuRepository;

        public GateConsultationFournisseurs(PrixDpuRepository prixDpuRepository) {
            this.prixDpuRepository = prixDpuRepository;
        }

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
            List<DpgfNoeud> articles = contexte.articles();
            List<ProblemeGate> pbs = new ArrayList<>();
            for (DpgfNoeud a : articles) {
                if (a.getPrixDpuId() == null) {
                    continue;
                }
                PrixDpu dpu = prixDpuRepository.findById(a.getPrixDpuId()).orElse(null);
                if (dpu == null || dpu.getComposants() == null) {
                    continue;
                }
                boolean nonConsulte = dpu.getComposants().stream()
                        .anyMatch(c -> !"CONSULTE".equals(c.getSourcePrix()));
                if (nonConsulte) {
                    pbs.add(probleme(a, "etudes.gate.consultation.prix_non_consulte"));
                }
            }
            return new ResultatGate(etape(), false, pbs);
        }
    }

    /** Étape 5 — chiffrage complet : taux renseignés et prix de vente établi. */
    @Component
    public static class GateChiffrage implements EtapeGate {

        private final PrixDpuRepository prixDpuRepository;

        public GateChiffrage(PrixDpuRepository prixDpuRepository) {
            this.prixDpuRepository = prixDpuRepository;
        }

        @Override
        public int etape() {
            return DossierEtude.ETAPE_CHIFFRAGE;
        }

        @Override
        public ResultatGate evaluer(ContexteGate contexte) {
            List<DpgfNoeud> articles = contexte.articles();
            List<ProblemeGate> pbs = new ArrayList<>();
            for (DpgfNoeud a : articles) {
                if (a.getPrixUnitaire() == null
                        || a.getPrixUnitaire().compareTo(BigDecimal.ZERO) <= 0) {
                    pbs.add(probleme(a, "etudes.gate.chiffrage.prix_absent"));
                    continue;
                }
                if (a.getPrixDpuId() == null) {
                    continue;
                }
                PrixDpu dpu = prixDpuRepository.findById(a.getPrixDpuId()).orElse(null);
                if (dpu == null) {
                    continue;
                }
                if (dpu.getFraisGenerauxPercent() == null
                        || dpu.getMargeBeneficiairePercent() == null) {
                    pbs.add(probleme(a, "etudes.gate.chiffrage.taux_manquants"));
                }
            }
            return new ResultatGate(etape(), true, pbs);
        }
    }
}
