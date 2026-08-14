package ma.nafura.catalogue.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.catalogue.domain.edition.CatalogCandidat;
import ma.nafura.catalogue.domain.edition.CatalogCandidatSignal;
import ma.nafura.catalogue.repository.CatalogCandidatRepository;
import ma.nafura.catalogue.repository.CatalogCandidatSignalRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * Job / service d'enrichissement L16 : crée uniquement des {@code catalog_candidats}.
 * Jamais d'article catalogue. Exemples anonymisés.
 */
@Service
public class CatalogEnrichissementService {

    public static final String MODEL_VERSION = "l16-enrichissement-v1";

    private final CatalogCandidatRepository candidatRepository;
    private final CatalogCandidatSignalRepository signalRepository;
    private final ObjectMapper objectMapper;

    public CatalogEnrichissementService(
            CatalogCandidatRepository candidatRepository,
            CatalogCandidatSignalRepository signalRepository,
            ObjectMapper objectMapper) {
        this.candidatRepository = candidatRepository;
        this.signalRepository = signalRepository;
        this.objectMapper = objectMapper;
    }

    /**
     * Enregistre une observation tenant (composant LIBRE / non rapproché).
     * Incrémente nb_tenants_confirmants une seule fois par tenant_hash.
     */
    @Transactional
    public CatalogCandidat contribuer(
            String libelleBrut, String nature, String uniteCode, String typeObjet, String proposePar) {
        String anonyme = LibelleAnonymizer.anonymiser(libelleBrut);
        if (!StringUtils.hasText(anonyme)) {
            throw new IllegalArgumentException("catalogue.enrichissement.libelle_vide");
        }
        String cle = LibelleAnonymizer.cleRegroupement(libelleBrut);
        String hash = tenantHash();
        String type = StringUtils.hasText(typeObjet) ? typeObjet.trim().toUpperCase(Locale.ROOT) : "ARTICLE";
        String parRaw = StringUtils.hasText(proposePar) ? proposePar.trim().toUpperCase(Locale.ROOT) : "REGLE";
        final String par = ("REGLE".equals(parRaw) || "IA".equals(parRaw) || "MANUEL".equals(parRaw))
                ? parRaw
                : "REGLE";

        CatalogCandidat candidat = findByCle(cle).orElseGet(() -> {
            CatalogCandidat c = CatalogCandidat.builder()
                    .libellePropose(anonyme)
                    .nature(nature)
                    .uniteCode(uniteCode)
                    .typeObjet(type)
                    .nbTenantsConfirmants(0)
                    .exemplesLibelles("[]")
                    .statut("PROPOSE")
                    .proposePar(par)
                    .modelVersion(MODEL_VERSION)
                    .build();
            return candidatRepository.save(c);
        });

        if (signalRepository.existsByCandidatIdAndTenantHash(candidat.getId(), hash)) {
            return candidat;
        }

        signalRepository.save(CatalogCandidatSignal.builder()
                .candidatId(candidat.getId())
                .tenantHash(hash)
                .libelleAnonyme(anonyme)
                .build());

        candidat.setNbTenantsConfirmants((int) signalRepository.countByCandidatId(candidat.getId()));
        candidat.setExemplesLibelles(mergeExemple(candidat.getExemplesLibelles(), anonyme));
        if ("IA".equals(par)) {
            candidat.setProposePar("IA");
            candidat.setModelVersion(MODEL_VERSION);
        }
        return candidatRepository.save(candidat);
    }

    /** Ne crée jamais d'article — surface explicite pour tests AC. */
    @Transactional
    public CatalogCandidat consoliderSansPublier(UUID candidatId) {
        CatalogCandidat c = candidatRepository
                .findById(candidatId)
                .orElseThrow(() -> new IllegalArgumentException("catalogue.candidat.introuvable"));
        c.setNbTenantsConfirmants((int) signalRepository.countByCandidatId(c.getId()));
        return candidatRepository.save(c);
    }

    private Optional<CatalogCandidat> findByCle(String cle) {
        return candidatRepository.findByStatutOrderByNbTenantsConfirmantsDescCreatedAtAsc("PROPOSE").stream()
                .filter(c -> cle.equals(LibelleAnonymizer.cleRegroupement(c.getLibellePropose())))
                .findFirst();
    }

    private String mergeExemple(String json, String anonyme) {
        try {
            List<String> list = objectMapper.readValue(
                    json != null ? json : "[]", new TypeReference<List<String>>() {});
            List<String> out = new ArrayList<>(list != null ? list : List.of());
            if (!out.contains(anonyme) && out.size() < 5) {
                out.add(anonyme);
            }
            // garde-fou : jamais d'UUID / email dans le JSON final
            out.replaceAll(LibelleAnonymizer::anonymiser);
            out.removeIf(s -> s == null || s.isBlank());
            return objectMapper.writeValueAsString(out);
        } catch (Exception ex) {
            return "[\"" + anonyme.replace("\"", "") + "\"]";
        }
    }

    static String tenantHash() {
        UUID tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            throw new IllegalStateException("catalogue.enrichissement.tenant_requis");
        }
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] dig = md.digest(("nafura-l16|" + tenantId).getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(dig);
        } catch (Exception ex) {
            throw new IllegalStateException("catalogue.enrichissement.hash_echec", ex);
        }
    }
}
