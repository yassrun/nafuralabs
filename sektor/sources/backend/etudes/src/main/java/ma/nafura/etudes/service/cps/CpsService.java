package ma.nafura.etudes.service.cps;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.etudes.api.dto.MarcheProposeDto;
import ma.nafura.etudes.domain.cps.CpsDocument;
import ma.nafura.etudes.domain.cps.CpsSection;
import ma.nafura.etudes.domain.dossier.DossierDocument;
import ma.nafura.etudes.domain.dpgf.DpgfNoeud;
import ma.nafura.etudes.repository.CpsDocumentRepository;
import ma.nafura.etudes.repository.CpsSectionRepository;
import ma.nafura.etudes.repository.DossierDocumentRepository;
import ma.nafura.etudes.service.cps.CpsSectionneur.SectionBrute;
import ma.nafura.etudes.service.cps.ExtracteurTextePdf.ResultatExtraction;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import ma.nafura.etudes.service.port.capability.DescriptifCpsPort;
import ma.nafura.etudes.service.port.capability.MarcheProposePort;
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
    private final MarcheProposePort marcheProposePort;

    public CpsService(
            DossierDocumentRepository dossierDocumentRepository,
            CpsDocumentRepository cpsDocumentRepository,
            CpsSectionRepository sectionRepository,
            ExtracteurTextePdf extracteur,
            CpsSectionneur sectionneur,
            DescriptifCpsPort descriptifPort,
            MarcheProposePort marcheProposePort) {
        this.dossierDocumentRepository = dossierDocumentRepository;
        this.cpsDocumentRepository = cpsDocumentRepository;
        this.sectionRepository = sectionRepository;
        this.extracteur = extracteur;
        this.sectionneur = sectionneur;
        this.descriptifPort = descriptifPort;
        this.marcheProposePort = marcheProposePort;
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
     * <p>Ordre : (1) même numéro que l'article — c'est la correspondance BDP ↔ CCTP ;
     * (2) plein texte en OU sur les mots porteurs du libellé ; (3) websearch du libellé
     * entier en dernier recours. Un AND sur « REVETEMENT … 20X20X1,2 CM Y COMPRIS PLINTHES »
     * rate la section 6.1.3 du CPS, qui existe pourtant.
     */
    @Transactional(readOnly = true)
    public List<CpsSection> rechercherPourArticle(UUID cpsDocumentId, DpgfNoeud article, int limite) {
        if (cpsDocumentId == null) {
            return List.of();
        }
        UUID indexId = resoudreIndexId(cpsDocumentId);
        UUID tenant = tenantId();
        int cap = Math.max(1, limite);
        List<CpsSection> out = new ArrayList<>();

        String code = article != null ? normaliserCodePourRecherche(article.getCode()) : "";
        if (StringUtils.hasText(code)) {
            ajouterUniques(out, sectionRepository.trouverParNumero(tenant, indexId, code, cap), cap);
        }
        if (!out.isEmpty()) {
            return out;
        }

        String tsquery = construireTsQueryOr(article);
        if (StringUtils.hasText(tsquery)) {
            ajouterUniques(out, sectionRepository.rechercherTsQuery(tenant, indexId, tsquery, cap), cap);
        }
        if (out.size() >= cap) {
            return out;
        }

        String libelleSeul = article != null && StringUtils.hasText(article.getLibelle())
                ? article.getLibelle().trim()
                : "";
        if (StringUtils.hasText(libelleSeul)) {
            ajouterUniques(out, sectionRepository.rechercher(tenant, indexId, libelleSeul, cap), cap);
        }
        return out;
    }

    /** Accepte l'id {@link CpsDocument} ou l'id de la pièce {@link DossierDocument}. */
    private UUID resoudreIndexId(UUID cpsDocumentId) {
        UUID tenant = tenantId();
        if (cpsDocumentId == null) {
            return null;
        }
        if (sectionRepository.countByTenantIdAndCpsDocumentId(tenant, cpsDocumentId) > 0) {
            return cpsDocumentId;
        }
        return cpsDocumentRepository
                .findByTenantIdAndDossierDocumentId(tenant, cpsDocumentId)
                .map(CpsDocument::getId)
                .orElse(cpsDocumentId);
    }

    private static void ajouterUniques(List<CpsSection> out, List<CpsSection> plus, int cap) {
        if (plus == null || plus.isEmpty()) {
            return;
        }
        java.util.Set<UUID> vus = new java.util.HashSet<>();
        for (CpsSection s : out) {
            if (s.getId() != null) {
                vus.add(s.getId());
            }
        }
        for (CpsSection s : plus) {
            if (out.size() >= cap) {
                return;
            }
            if (s == null || (s.getId() != null && !vus.add(s.getId()))) {
                continue;
            }
            out.add(s);
        }
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

    /**
     * Propose métadonnées + checklist pièces après index CPS.
     *
     * <p>Vide (→ 204) si le port est indisponible ou si les sections ne permettent pas de
     * conclure — l'UI bascule alors en parcours manuel.
     */
    @Transactional(readOnly = true)
    public Optional<MarcheProposeDto> proposerMarche(UUID dossierDocumentId) {
        if (!marcheProposePort.isAvailable()) {
            return Optional.empty();
        }
        UUID tenant = tenantId();
        CpsDocument cps = cpsDocumentRepository
                .findByTenantIdAndDossierDocumentId(tenant, dossierDocumentId)
                .orElse(null);
        if (cps == null || cps.getId() == null) {
            return Optional.empty();
        }
        List<CpsSection> sections =
                sectionRepository.findByTenantIdAndCpsDocumentIdOrderByOrdreAsc(tenant, cps.getId());
        if (sections.isEmpty()) {
            return Optional.empty();
        }
        return marcheProposePort.proposer(sections);
    }

    @Transactional(readOnly = true)
    public List<CpsSection> sections(UUID cpsDocumentId) {
        return sectionRepository.findByTenantIdAndCpsDocumentIdOrderByOrdreAsc(tenantId(), cpsDocumentId);
    }

    /**
     * Visible pour les tests : la forme de la requete conditionne la qualite du rappel.
     *
     * <p>Les codes bordereau utilisent souvent des tirets ({@code 1-1-3}) alors que le CPS
     * numerote avec des points ({@code 1.1.3}). {@code websearch_to_tsquery} traite
     * {@code 1-1-3} comme une phrase ({@code '1' <-> '-1' <-> '-3'}) qui ne matche jamais —
     * d'ou zero section trouvee alors que le libelle seul retrouve bien le passage.
     */
    static String construireRequete(DpgfNoeud article) {
        StringBuilder sb = new StringBuilder();
        if (article != null && StringUtils.hasText(article.getCode())) {
            sb.append(normaliserCodePourRecherche(article.getCode())).append(' ');
        }
        if (article != null && StringUtils.hasText(article.getLibelle())) {
            sb.append(article.getLibelle());
        }
        return sb.toString().trim();
    }

    /**
     * Mots porteurs du libellé, en OU pour {@code to_tsquery('french', …)}.
     *
     * <p>On écarte dimensions, unités et mots-outils BDP (« y compris », « importation »)
     * qui ne figurent pas dans le CCTP et faisaient échouer un AND.
     */
    static String construireTsQueryOr(DpgfNoeud article) {
        if (article == null || !StringUtils.hasText(article.getLibelle())) {
            return "";
        }
        String fold = java.text.Normalizer.normalize(article.getLibelle(), java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .toLowerCase(java.util.Locale.ROOT);
        String[] brut = fold.split("[^a-z0-9]+");
        java.util.LinkedHashSet<String> mots = new java.util.LinkedHashSet<>();
        for (String m : brut) {
            if (m.length() < 3 || STOP_RECHERCHE.contains(m) || m.matches("\\d+[x×]\\d+.*") || m.chars().allMatch(Character::isDigit)) {
                continue;
            }
            mots.add(m);
            if (mots.size() >= 8) {
                break;
            }
        }
        return String.join(" | ", mots);
    }

    private static final java.util.Set<String> STOP_RECHERCHE = java.util.Set.of(
            "de", "du", "des", "la", "le", "les", "en", "et", "ou", "un", "une",
            "d", "l", "y", "pour", "par", "avec", "sans", "sur", "aux", "au", "a",
            "cm", "mm", "ml", "m2", "m3", "kg", "u",
            "compris", "ycompris", "importation", "import",
            "fourniture", "pose");

    /** Aligne la numerotation bordereau sur celle du CPS pour le tsquery. */
    static String normaliserCodePourRecherche(String code) {
        if (!StringUtils.hasText(code)) {
            return "";
        }
        return code.trim().replace('-', '.');
    }

    private static UUID tenantId() {
        return TenantContext.getTenantId();
    }
}
