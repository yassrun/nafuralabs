package ma.nafura.catalogue.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import ma.nafura.catalogue.domain.model.CatalogArticle;
import ma.nafura.catalogue.domain.model.CatalogCandidat;
import ma.nafura.catalogue.domain.model.CatalogComposant;
import ma.nafura.catalogue.domain.model.CatalogEdition;
import ma.nafura.catalogue.domain.model.CatalogOuvrage;
import ma.nafura.catalogue.domain.model.CatalogPrixReference;
import ma.nafura.catalogue.repository.CatalogArticleRepository;
import ma.nafura.catalogue.repository.CatalogCandidatRepository;
import ma.nafura.catalogue.repository.CatalogComposantRepository;
import ma.nafura.catalogue.repository.CatalogEditionRepository;
import ma.nafura.catalogue.repository.CatalogOuvrageRepository;
import ma.nafura.catalogue.repository.CatalogPrixReferenceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Amorçage lab : édition 2026.1 + échantillon anonymisé + candidats G2.
 * Corpus 84 complet = endpoint seed-corpus (copie structure, libellés reformulés).
 */
@Service
public class CatalogSeedService {

    public static final String EDITION_DEMO = "2026.1";

    private final CatalogEditionRepository editionRepository;
    private final CatalogArticleRepository articleRepository;
    private final CatalogOuvrageRepository ouvrageRepository;
    private final CatalogComposantRepository composantRepository;
    private final CatalogPrixReferenceRepository prixRepository;
    private final CatalogCandidatRepository candidatRepository;

    public CatalogSeedService(
            CatalogEditionRepository editionRepository,
            CatalogArticleRepository articleRepository,
            CatalogOuvrageRepository ouvrageRepository,
            CatalogComposantRepository composantRepository,
            CatalogPrixReferenceRepository prixRepository,
            CatalogCandidatRepository candidatRepository) {
        this.editionRepository = editionRepository;
        this.articleRepository = articleRepository;
        this.ouvrageRepository = ouvrageRepository;
        this.composantRepository = composantRepository;
        this.prixRepository = prixRepository;
        this.candidatRepository = candidatRepository;
    }

    @Transactional
    public Map<String, Object> seedDemoIfEmpty() {
        if (editionRepository.findByCode(EDITION_DEMO).isPresent()) {
            return Map.of("seeded", false, "edition", EDITION_DEMO);
        }

        editionRepository.save(CatalogEdition.builder()
                .code(EDITION_DEMO)
                .statut("PUBLIEE")
                .publieLe(OffsetDateTime.now())
                .notes("Amorçage lab L14 — corpus anonymisé")
                .build());

        CatalogArticle peinture = articleRepository.save(CatalogArticle.builder()
                .cleStable("peinture-acrylique-interieure")
                .nature("MATIERE")
                .libelle("Peinture acrylique intérieure")
                .uniteCode("L")
                .codeFamille("FIN_PEINT")
                .statut("PUBLIE")
                .editionPublication(EDITION_DEMO)
                .build());

        articleRepository.save(CatalogArticle.builder()
                .cleStable("ciment-cpj-45")
                .nature("MATIERE")
                .libelle("Ciment CPJ 45")
                .uniteCode("T")
                .codeFamille("MAC_ELEV")
                .statut("PUBLIE")
                .editionPublication(EDITION_DEMO)
                .build());

        prixRepository.save(CatalogPrixReference.builder()
                .catalogArticleCle(peinture.getCleStable())
                .prix(new BigDecimal("28.00"))
                .devise("MAD")
                .validFrom(LocalDate.of(2026, 1, 1))
                .source("agrégat multi-tenant (≥5)")
                .edition(EDITION_DEMO)
                .build());

        CatalogOuvrage enduit = ouvrageRepository.save(CatalogOuvrage.builder()
                .cleStable("enduit-exterieur-monocouche")
                .libelle("Enduit extérieur monocouche")
                .uniteCode("M2")
                .codeLot("GROS_OEUVRE")
                .codeFamille("MAC_ELEV")
                .codeOuvrage("END-EXT-01")
                .statut("PUBLIE")
                .editionPublication(EDITION_DEMO)
                .build());

        composantRepository.save(CatalogComposant.builder()
                .catalogOuvrageId(enduit.getId())
                .rang(1)
                .nature("MATIERE")
                .libelle("Mortier monocouche")
                .uniteCode("KG")
                .rendement(new BigDecimal("12.000000"))
                .catalogArticleCle(null)
                .baseRendement("PAR_UNITE")
                .build());
        composantRepository.save(CatalogComposant.builder()
                .catalogOuvrageId(enduit.getId())
                .rang(2)
                .nature("MAIN_DOEUVRE")
                .libelle("Maçon enduiseur")
                .uniteCode("H")
                .rendement(new BigDecimal("0.350000"))
                .baseRendement("PAR_UNITE")
                .build());

        candidatRepository.save(CatalogCandidat.builder()
                .libellePropose("Peinture acrylique intérieure mate")
                .nature("MATIERE")
                .uniteCode("L")
                .codeFamille("FIN_PEINT")
                .typeObjet("ARTICLE")
                .nbTenantsConfirmants(7)
                .exemplesLibelles(
                        "[\"peinture mur blanc\",\"peinture acrylique mur\",\"peinture interieure blanche\"]")
                .rendementMin(new BigDecimal("0.120000"))
                .rendementMax(new BigDecimal("0.180000"))
                .rendementMedian(new BigDecimal("0.150000"))
                .statut("PROPOSE")
                .proposePar("REGLE")
                .build());

        candidatRepository.save(CatalogCandidat.builder()
                .libellePropose("Enduit spécial façade ornementale")
                .nature("MATIERE")
                .uniteCode("M2")
                .codeFamille("MAC_ELEV")
                .typeObjet("ARTICLE")
                .nbTenantsConfirmants(1)
                .exemplesLibelles("[\"enduit facade ornement\"]")
                .statut("PROPOSE")
                .proposePar("REGLE")
                .build());

        return Map.of(
                "seeded",
                true,
                "edition",
                EDITION_DEMO,
                "articles",
                articleRepository.count(),
                "ouvrages",
                ouvrageRepository.count(),
                "candidats",
                candidatRepository.count());
    }

    @Transactional(readOnly = true)
    public List<CatalogEdition> editions() {
        return editionRepository.findAllByOrderByCodeDesc();
    }
}
