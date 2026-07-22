package ma.nafura.etudes.service.cps;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.etudes.domain.model.CpsDocument;
import ma.nafura.etudes.domain.model.CpsSection;
import ma.nafura.etudes.domain.model.DossierDocument;
import ma.nafura.etudes.domain.model.DpgfNoeud;
import ma.nafura.etudes.repository.CpsDocumentRepository;
import ma.nafura.etudes.repository.CpsSectionRepository;
import ma.nafura.etudes.repository.DossierDocumentRepository;
import ma.nafura.etudes.service.cps.CpsSectionneur.SectionBrute;
import ma.nafura.etudes.service.cps.ExtracteurTextePdf.ResultatExtraction;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * Indexation d'un CPS et recherche par article.
 *
 * <p>Deux temps distincts. <b>Une fois a l'upload</b> : extraire, decouper, indexer. <b>A chaque
 * interrogation</b> : rechercher les sections pertinentes, puis — seulement si un port IA est
 * cable — proposer un descriptif a partir de ces sections.
 *
 * <p>La recherche ne consomme aucun token : c'est du {@code tsvector} Postgres. Le modele ne
 * voit jamais le CPS entier.
 */
@Service
public class CpsService {

    /** Nombre de sections passees au modele. Assez pour couvrir, assez peu pour rester bon marche. */
    private static final int SECTIONS_CANDIDATES = 4;

    private final DossierDocumentRepository dossierDocumentRepository;
    private final CpsDocumentRepository cpsDocumentRepository;
    private final CpsSectionRepository sectionRepository;
    private final ExtracteurTextePdf extracteur;
    private final CpsSectionneur sectionneur;
    private final DescriptifCpsPort descriptifPort;

    public CpsService(
            DossierDocumentRepository dossierDocumentRepository,
            CpsDocumentRepository cpsDocumentRepository,
            CpsSectionRepository sectionRepository,
            ExtracteurTextePdf extracteur,
            CpsSectionneur sectionneur,
            DescriptifCpsPort descriptifPort) {
        this.dossierDocumentRepository = dossierDocumentRepository;
        this.cpsDocumentRepository = cpsDocumentRepository;
        this.sectionRepository = sectionRepository;
        this.extracteur = extracteur;
        this.sectionneur = sectionneur;
        this.descriptifPort = descriptifPort;
    }

    /**
     * Indexe le CPS d'une piece deja deposee.
     *
     * <p>Reentrant : reindexer remplace les sections precedentes. C'est ce qui permettra de
     * rejouer l'extraction depuis l'original le jour ou le decoupage s'ameliore, ou ou une
     * conversion scan -> texte sera disponible.
     */
    @Transactional
    public CpsDocument indexer(UUID dossierDocumentId, byte[] contenu) {
        UUID tenant = tenantId();
        DossierDocument piece = dossierDocumentRepository
                .findByIdAndTenantId(dossierDocumentId, tenant)
                .orElseThrow(() -> new IllegalArgumentException("etudes.document.introuvable"));
        if (!piece.contientCps()) {
            throw new IllegalArgumentException("etudes.document.pas_un_cps");
        }

        CpsDocument cps = cpsDocumentRepository
                .findByTenantIdAndDossierDocumentId(tenant, dossierDocumentId)
                .orElseGet(() -> CpsDocument.builder()
                        .tenantId(tenant)
                        .dossierDocumentId(dossierDocumentId)
                        .build());

        ResultatExtraction extraction = extracteur.extraire(contenu);
        cps.setNbPages(extraction.nbPages());
        cps.setDensiteTexte(extraction.densiteTexte());
        cps.setQualiteSource(extraction.qualiteSource());
        cps.setMessageExtraction(extraction.message());
        cps.setExtraitLe(OffsetDateTime.now());
        cps.setStatutExtraction(CpsDocument.STATUT_EN_COURS);

        if (!extraction.exploitable()) {
            // Le fichier reste stocke et consultable ; seule l'indexation est indisponible.
            // La saisie manuelle des descriptifs reste ouverte.
            cps.setStatutExtraction(CpsDocument.STATUT_NON_SUPPORTE);
            cps.setNbSections(0);
            CpsDocument sauve = cpsDocumentRepository.save(cps);
            sectionRepository.deleteByCpsDocumentId(sauve.getId());
            return sauve;
        }

        CpsDocument sauve = cpsDocumentRepository.save(cps);
        sectionRepository.deleteByCpsDocumentId(sauve.getId());

        List<SectionBrute> brutes = sectionneur.decouper(extraction.texte());
        List<CpsSection> sections = new ArrayList<>(brutes.size());
        for (SectionBrute b : brutes) {
            sections.add(CpsSection.builder()
                    .tenantId(tenant)
                    .cpsDocumentId(sauve.getId())
                    .numero(b.numero())
                    .titre(b.titre())
                    .contenu(b.contenu())
                    .ordre(b.ordre())
                    .build());
        }
        sectionRepository.saveAll(sections);

        sauve.setNbSections(sections.size());
        sauve.setStatutExtraction(
                sections.isEmpty() ? CpsDocument.STATUT_ECHEC : CpsDocument.STATUT_TERMINE);
        return cpsDocumentRepository.save(sauve);
    }

    /**
     * Sections du CPS pertinentes pour un article.
     *
     * <p>La requete combine le code et le libelle : le code remonte les sections dont la
     * numerotation correspond (ponderation 'A'), le libelle rattrape les cas ou la numerotation
     * du CPS et celle du bordereau divergent — ce qui est frequent.
     */
    @Transactional(readOnly = true)
    public List<CpsSection> rechercherPourArticle(UUID cpsDocumentId, DpgfNoeud article, int limite) {
        String requete = construireRequete(article);
        if (requete.isBlank()) {
            return List.of();
        }
        return sectionRepository.rechercher(tenantId(), cpsDocumentId, requete, limite);
    }

    /**
     * Propose un descriptif pour un article, en deux temps : recherche locale, puis modele sur
     * les seules sections retenues.
     *
     * <p>Vide si aucun port IA n'est cable — le parcours reste utilisable, le chiffreur lit les
     * sections retrouvees et redige lui-meme.
     */
    @Transactional(readOnly = true)
    public Optional<DescriptifCpsPort.DescriptifPropose> proposerDescriptif(
            UUID cpsDocumentId, DpgfNoeud article) {
        if (!descriptifPort.isAvailable()) {
            return Optional.empty();
        }
        List<CpsSection> candidates = rechercherPourArticle(cpsDocumentId, article, SECTIONS_CANDIDATES);
        if (candidates.isEmpty()) {
            return Optional.empty();
        }
        return descriptifPort.proposer(article, candidates);
    }

    @Transactional(readOnly = true)
    public List<CpsSection> sections(UUID cpsDocumentId) {
        return sectionRepository.findByTenantIdAndCpsDocumentIdOrderByOrdreAsc(tenantId(), cpsDocumentId);
    }

    /** Visible pour les tests : la forme de la requete conditionne la qualite du rappel. */
    static String construireRequete(DpgfNoeud article) {
        StringBuilder sb = new StringBuilder();
        if (article != null && StringUtils.hasText(article.getCode())) {
            sb.append(article.getCode()).append(' ');
        }
        if (article != null && StringUtils.hasText(article.getLibelle())) {
            sb.append(article.getLibelle());
        }
        return sb.toString().trim();
    }

    private static UUID tenantId() {
        return TenantContext.getTenantId();
    }
}
