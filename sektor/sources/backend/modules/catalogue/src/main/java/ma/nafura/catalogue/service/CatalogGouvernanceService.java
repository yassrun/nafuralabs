package ma.nafura.catalogue.service;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import ma.nafura.catalogue.domain.model.CatalogArticle;
import ma.nafura.catalogue.domain.model.CatalogCandidat;
import ma.nafura.catalogue.domain.model.CatalogEdition;
import ma.nafura.catalogue.domain.model.CatalogOuvrage;
import ma.nafura.catalogue.repository.CatalogArticleRepository;
import ma.nafura.catalogue.repository.CatalogCandidatRepository;
import ma.nafura.catalogue.repository.CatalogEditionRepository;
import ma.nafura.catalogue.repository.CatalogOuvrageRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class CatalogGouvernanceService {

    private final CatalogCandidatRepository candidatRepository;
    private final CatalogArticleRepository articleRepository;
    private final CatalogOuvrageRepository ouvrageRepository;
    private final CatalogEditionRepository editionRepository;
    private final CatalogGouvernanceParams params;

    public CatalogGouvernanceService(
            CatalogCandidatRepository candidatRepository,
            CatalogArticleRepository articleRepository,
            CatalogOuvrageRepository ouvrageRepository,
            CatalogEditionRepository editionRepository,
            CatalogGouvernanceParams params) {
        this.candidatRepository = candidatRepository;
        this.articleRepository = articleRepository;
        this.ouvrageRepository = ouvrageRepository;
        this.editionRepository = editionRepository;
        this.params = params;
    }

    @Transactional(readOnly = true)
    public List<CatalogCandidat> listerProposes() {
        return listerProposesEligibles();
    }

    /**
     * Console éditoriale — uniquement les candidats au-dessus du seuil (AC L16).
     * Les sous-seuil restent en base mais n'atteignent pas la console.
     */
    @Transactional(readOnly = true)
    public List<CatalogCandidat> listerProposesEligibles() {
        return candidatRepository.findByStatutOrderByNbTenantsConfirmantsDescCreatedAtAsc("PROPOSE").stream()
                .filter(this::estEligible)
                .toList();
    }

    /** Debug / tests — tous les PROPOSE y compris sous seuil. */
    @Transactional(readOnly = true)
    public List<CatalogCandidat> listerTousProposes() {
        return candidatRepository.findByStatutOrderByNbTenantsConfirmantsDescCreatedAtAsc("PROPOSE");
    }

    @Transactional(readOnly = true)
    public boolean estEligible(CatalogCandidat c) {
        int seuil = params.seuilPourType(c.getTypeObjet());
        return c.getNbTenantsConfirmants() != null && c.getNbTenantsConfirmants() >= seuil;
    }

    @Transactional
    public CatalogCandidat publier(UUID candidatId, String editionCode, String decidePar) {
        CatalogCandidat c = candidatRepository
                .findById(candidatId)
                .orElseThrow(() -> new IllegalArgumentException("catalogue.candidat.introuvable"));
        if (!"PROPOSE".equals(c.getStatut())) {
            throw new IllegalStateException("catalogue.candidat.hors_etat");
        }
        if (!estEligible(c)) {
            throw new IllegalStateException(
                    "catalogue.candidat.sous_seuil: "
                            + c.getNbTenantsConfirmants()
                            + "/"
                            + params.seuilPourType(c.getTypeObjet()));
        }
        String edition = resolveEditionCode(editionCode);
        String cle = CatalogSlug.from(c.getLibellePropose());
        if ("OUVRAGE".equalsIgnoreCase(c.getTypeObjet())) {
            if (ouvrageRepository.existsByCleStable(cle)) {
                cle = cle + "-" + UUID.randomUUID().toString().substring(0, 8);
            }
            ouvrageRepository.save(CatalogOuvrage.builder()
                    .cleStable(cle)
                    .libelle(c.getLibellePropose())
                    .uniteCode(StringUtils.hasText(c.getUniteCode()) ? c.getUniteCode() : "U")
                    .codeFamille(c.getCodeFamille())
                    .statut("PUBLIE")
                    .editionPublication(edition)
                    .build());
        } else {
            if (articleRepository.existsByCleStable(cle)) {
                cle = cle + "-" + UUID.randomUUID().toString().substring(0, 8);
            }
            articleRepository.save(CatalogArticle.builder()
                    .cleStable(cle)
                    .nature(StringUtils.hasText(c.getNature()) ? c.getNature() : "MATIERE")
                    .libelle(c.getLibellePropose())
                    .uniteCode(StringUtils.hasText(c.getUniteCode()) ? c.getUniteCode() : "U")
                    .codeFamille(c.getCodeFamille())
                    .statut("PUBLIE")
                    .editionPublication(edition)
                    .build());
        }
        c.setStatut("ACCEPTE");
        c.setCatalogCleCreee(cle);
        c.setDecidePar(decidePar);
        c.setDecideLe(OffsetDateTime.now());
        return candidatRepository.save(c);
    }

    @Transactional
    public CatalogCandidat refuser(UUID candidatId, String decidePar) {
        CatalogCandidat c = candidatRepository
                .findById(candidatId)
                .orElseThrow(() -> new IllegalArgumentException("catalogue.candidat.introuvable"));
        if (!"PROPOSE".equals(c.getStatut())) {
            throw new IllegalStateException("catalogue.candidat.hors_etat");
        }
        c.setStatut("REFUSE");
        c.setDecidePar(decidePar);
        c.setDecideLe(OffsetDateTime.now());
        return candidatRepository.save(c);
    }

    private String resolveEditionCode(String editionCode) {
        if (StringUtils.hasText(editionCode)) {
            CatalogEdition ed = editionRepository
                    .findByCode(editionCode.trim())
                    .orElseThrow(() -> new IllegalArgumentException("catalogue.edition.introuvable"));
            return ed.getCode();
        }
        return editionRepository.findAllByOrderByCodeDesc().stream()
                .filter(e -> "PUBLIEE".equals(e.getStatut()) || "BROUILLON".equals(e.getStatut()))
                .map(CatalogEdition::getCode)
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("catalogue.edition.aucune"));
    }
}
