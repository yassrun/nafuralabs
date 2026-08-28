package ma.nafura.etudes.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.etudes.api.dto.DossierAgentContextDto;
import ma.nafura.etudes.api.dto.DossierAgentProvenanceEtapeDto;
import ma.nafura.etudes.api.dto.DossierAgentSuggestionDto;
import ma.nafura.etudes.api.dto.RattrapageGroupeDto;
import ma.nafura.etudes.api.dto.completude.CompletudeEtude;
import ma.nafura.etudes.api.dto.completude.ControleEtude;
import ma.nafura.etudes.api.dto.completude.SeveriteControle;
import ma.nafura.etudes.domain.dossier.DossierAgentActionType;
import ma.nafura.etudes.domain.dossier.DossierAgentSuggestion;
import ma.nafura.etudes.domain.dossier.DossierAgentSuggestionEtat;
import ma.nafura.etudes.domain.dossier.DossierDocument;
import ma.nafura.etudes.domain.dossier.DossierEtude;
import ma.nafura.etudes.repository.DossierAgentSuggestionRepository;
import ma.nafura.etudes.repository.DossierDocumentRepository;
import ma.nafura.etudes.repository.DossierEtudeRepository;
import ma.nafura.etudes.service.gate.ResultatGate;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.context.UserContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/** IA contextuelle du dossier ouvert — gestes bornés, journal persisté (SEKTOR-218 AC-16). */
@Service
public class DossierAgentService {

    private final DossierEtudeRepository dossierRepository;
    private final DossierDocumentRepository documentRepository;
    private final DossierAgentSuggestionRepository suggestionRepository;
    private final CompletudeEtudeService completudeEtudeService;
    private final DossierEtudeService dossierEtudeService;
    private final RattrapageComposantService rattrapageService;
    private final ObjectMapper objectMapper;

    public DossierAgentService(
            DossierEtudeRepository dossierRepository,
            DossierDocumentRepository documentRepository,
            DossierAgentSuggestionRepository suggestionRepository,
            CompletudeEtudeService completudeEtudeService,
            DossierEtudeService dossierEtudeService,
            RattrapageComposantService rattrapageService,
            ObjectMapper objectMapper) {
        this.dossierRepository = dossierRepository;
        this.documentRepository = documentRepository;
        this.suggestionRepository = suggestionRepository;
        this.completudeEtudeService = completudeEtudeService;
        this.dossierEtudeService = dossierEtudeService;
        this.rattrapageService = rattrapageService;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public DossierAgentContextDto contexte(UUID dossierId) {
        DossierEtude dossier = requireDossier(dossierId);
        return DossierAgentContextDto.builder()
                .dossierId(dossier.getId())
                .numero(dossier.getNumero())
                .objet(dossier.getObjet())
                .provenance(provenance(dossier))
                .journal(journal(dossierId))
                .chatGenerique(false)
                .build();
    }

    @Transactional
    public List<DossierAgentSuggestionDto> proposerChiffrage(UUID dossierId) {
        DossierEtude dossier = requireDossier(dossierId);
        CompletudeEtude completude = completudeEtudeService.evaluer(dossier);
        List<DossierAgentSuggestion> created = new ArrayList<>();
        for (ControleEtude controle : completude.getControles()) {
            if (controle.getAction() == null) {
                continue;
            }
            String libelle = libelleControleChiffrage(controle);
            created.add(persistIfNew(
                    dossier,
                    DossierAgentActionType.CHIFFRAGE,
                    libelle,
                    fingerprint("CHIFFRAGE", controle.getCode(), controle.getNoeudId()),
                    provenanceJson(controle.getNoeudId(), controle.getCode())));
        }
        if (created.isEmpty()) {
            created.add(persistIfNew(
                    dossier,
                    DossierAgentActionType.CHIFFRAGE,
                    "Aucun écart de chiffrage détecté sur ce dossier.",
                    fingerprint("CHIFFRAGE", "OK", null),
                    null));
        }
        return created.stream().map(this::toDto).toList();
    }

    @Transactional
    public List<DossierAgentSuggestionDto> proposerIncoherences(UUID dossierId) {
        DossierEtude dossier = requireDossier(dossierId);
        List<ResultatGate> gates = dossierEtudeService.evaluerGates(dossierId);
        List<DossierAgentSuggestion> created = new ArrayList<>();
        for (ResultatGate gate : gates) {
            gate.problemes().forEach(probleme -> {
                String libelle = probleme.libelle() != null ? probleme.libelle() : probleme.message();
                if (!StringUtils.hasText(libelle)) {
                    libelle = "Incohérence détectée à l'étape " + gate.etape();
                }
                created.add(persistIfNew(
                        dossier,
                        DossierAgentActionType.INCOHERENCES,
                        libelle,
                        fingerprint(
                                "INCOHERENCES",
                                gate.etape() + "|" + libelle,
                                probleme.noeudId()),
                        provenanceJson(probleme.noeudId(), probleme.codeArticle())));
            });
        }
        if (created.isEmpty()) {
            created.add(persistIfNew(
                    dossier,
                    DossierAgentActionType.INCOHERENCES,
                    "Aucune incohérence bloquante sur ce dossier.",
                    fingerprint("INCOHERENCES", "OK", null),
                    null));
        }
        return created.stream().map(this::toDto).toList();
    }

    @Transactional
    public List<DossierAgentSuggestionDto> proposerRattachementsCatalogue(UUID dossierId) {
        DossierEtude dossier = requireDossier(dossierId);
        var resume = rattrapageService.resume(dossierId);
        List<DossierAgentSuggestion> created = new ArrayList<>();
        List<RattrapageGroupeDto> groupes =
                resume.getGroupesDetail() != null ? resume.getGroupesDetail() : List.of();
        for (RattrapageGroupeDto g : groupes) {
            String libelle = "Rattacher « " + g.getLibelle() + " » au catalogue (×" + g.getCount() + ")";
            created.add(persistIfNew(
                    dossier,
                    DossierAgentActionType.RATTACHEMENTS_CATALOGUE,
                    libelle,
                    fingerprint("RATTACHEMENTS", g.getLibelle(), null),
                    provenanceJson(null, g.getLibelle())));
        }
        if (created.isEmpty()) {
            created.add(persistIfNew(
                    dossier,
                    DossierAgentActionType.RATTACHEMENTS_CATALOGUE,
                    "Aucun composant LIBRE à rattacher.",
                    fingerprint("RATTACHEMENTS", "OK", null),
                    null));
        }
        return created.stream().map(this::toDto).toList();
    }

    @Transactional
    public DossierAgentSuggestionDto accepter(UUID dossierId, UUID suggestionId) {
        return decider(dossierId, suggestionId, DossierAgentSuggestionEtat.ACCEPTEE, null);
    }

    @Transactional
    public DossierAgentSuggestionDto refuser(UUID dossierId, UUID suggestionId) {
        return decider(dossierId, suggestionId, DossierAgentSuggestionEtat.REFUSEE, null);
    }

    @Transactional
    public DossierAgentSuggestionDto corriger(UUID dossierId, UUID suggestionId, String note) {
        return decider(dossierId, suggestionId, DossierAgentSuggestionEtat.CORRIGEE, note.trim());
    }

    private DossierAgentSuggestionDto decider(
            UUID dossierId,
            UUID suggestionId,
            DossierAgentSuggestionEtat etat,
            String correctionNote) {
        DossierAgentSuggestion suggestion = suggestionRepository
                .findByIdAndTenantIdAndDossierEtudeId(suggestionId, tenantId(), dossierId)
                .orElseThrow(() -> new IllegalArgumentException("etudes.agent.suggestion_introuvable"));
        if (suggestion.getEtat() != DossierAgentSuggestionEtat.EN_ATTENTE) {
            throw new IllegalStateException("etudes.agent.suggestion_deja_traitee");
        }
        suggestion.setEtat(etat);
        suggestion.setActeur(acteurCourant());
        suggestion.setDecidedAt(OffsetDateTime.now());
        if (StringUtils.hasText(correctionNote)) {
            suggestion.setCorrectionNote(correctionNote);
        }
        return toDto(suggestionRepository.save(suggestion));
    }

    private List<DossierAgentProvenanceEtapeDto> provenance(DossierEtude dossier) {
        List<DossierDocument> docs =
                documentRepository.findByTenantIdAndDossierEtudeIdOrderByOrdreAsc(
                        tenantId(), dossier.getId());
        List<DossierAgentProvenanceEtapeDto> chain = new ArrayList<>();

        docs.stream()
                .filter(DossierDocument::contientCps)
                .findFirst()
                .ifPresent(cps -> chain.add(DossierAgentProvenanceEtapeDto.builder()
                        .etape("CPS")
                        .libelle("Cahier des prescriptions")
                        .reference(cps.getNomFichier())
                        .source(cps.getDocumentId())
                        .build()));

        if (dossier.getDpgfId() != null) {
            docs.stream()
                    .filter(DossierDocument::contientBordereau)
                    .findFirst()
                    .ifPresentOrElse(
                            bdp -> chain.add(DossierAgentProvenanceEtapeDto.builder()
                                    .etape("DPGF")
                                    .libelle("Bordereau des prix")
                                    .reference(bdp.getNomFichier())
                                    .source(dossier.getDpgfId().toString())
                                    .build()),
                            () -> chain.add(DossierAgentProvenanceEtapeDto.builder()
                                    .etape("DPGF")
                                    .libelle("Arbre du bordereau")
                                    .reference(dossier.getDpgfId().toString())
                                    .source("manuel")
                                    .build()));
        }

        CompletudeEtude completude = completudeEtudeService.evaluer(dossier);
        if (completude.getQualiteChiffrage() != null) {
            chain.add(DossierAgentProvenanceEtapeDto.builder()
                    .etape("COUT")
                    .libelle("Chiffrage déboursé")
                    .reference(completude.getQualiteChiffrage().getRatioComposantsAffichage())
                    .source(completude
                                    .getQualiteChiffrage()
                                    .getPartEtablie()
                                    .stripTrailingZeros()
                            + " % établi")
                    .build());
        }

        return List.copyOf(chain);
    }

    private List<DossierAgentSuggestionDto> journal(UUID dossierId) {
        return suggestionRepository
                .findByTenantIdAndDossierEtudeIdOrderByCreatedAtDesc(tenantId(), dossierId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    private DossierAgentSuggestion persistIfNew(
            DossierEtude dossier,
            DossierAgentActionType actionType,
            String libelle,
            String fingerprint,
            String provenanceJson) {
        Optional<DossierAgentSuggestion> existing = suggestionRepository.findByTenantIdAndDossierEtudeIdAndFingerprint(
                tenantId(), dossier.getId(), fingerprint);
        if (existing.isPresent()) {
            return existing.get();
        }
        DossierAgentSuggestion row = DossierAgentSuggestion.builder()
                .tenantId(tenantId())
                .dossierEtudeId(dossier.getId())
                .actionType(actionType)
                .libelle(libelle)
                .fingerprint(fingerprint)
                .provenanceJson(provenanceJson)
                .build();
        return suggestionRepository.save(row);
    }

    private DossierAgentSuggestionDto toDto(DossierAgentSuggestion row) {
        OffsetDateTime date = row.getDecidedAt() != null ? row.getDecidedAt() : row.getCreatedAt();
        return DossierAgentSuggestionDto.builder()
                .id(row.getId())
                .actionType(row.getActionType().name())
                .libelle(row.getLibelle())
                .etat(row.getEtat().name())
                .acteur(row.getActeur())
                .date(date)
                .correctionNote(row.getCorrectionNote())
                .provenanceJson(row.getProvenanceJson())
                .build();
    }

    private String libelleControleChiffrage(ControleEtude controle) {
        if (CompletudeEtudeService.ETU_130.equals(controle.getCode())) {
            return "Établir le déboursé des postes — 100 % des coûts non établis";
        }
        if (CompletudeEtudeService.ETU_120.equals(controle.getCode())) {
            Object part = controle.getFaits() != null ? controle.getFaits().get("partEstimee") : null;
            return "Compléter le chiffrage — part estimée "
                    + (part != null ? part + " %" : "partielle");
        }
        if (CompletudeEtudeService.ETU_131.equals(controle.getCode())) {
            Object libres = controle.getFaits() != null ? controle.getFaits().get("libres") : null;
            return "Trancher "
                    + (libres != null ? libres : "des")
                    + " composant(s) LIBRE avant le gain";
        }
        return controle.getMessageKey() != null
                ? controle.getMessageKey()
                : "Contrôle chiffrage " + controle.getCode();
    }

    private String provenanceJson(UUID noeudId, String code) {
        Map<String, Object> map = new LinkedHashMap<>();
        if (noeudId != null) {
            map.put("noeudId", noeudId.toString());
        }
        if (StringUtils.hasText(code)) {
            map.put("code", code);
        }
        if (map.isEmpty()) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(map);
        } catch (JsonProcessingException ex) {
            return null;
        }
    }

    private static String fingerprint(String action, String key, UUID noeudId) {
        String raw = action + "|" + key + "|" + (noeudId != null ? noeudId : "");
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(raw.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash, 0, 16);
        } catch (Exception ex) {
            return raw.hashCode() + "";
        }
    }

    private DossierEtude requireDossier(UUID dossierId) {
        return dossierRepository
                .findByIdAndTenantId(dossierId, tenantId())
                .orElseThrow(() -> new IllegalArgumentException("etudes.dossier.introuvable"));
    }

    private UUID tenantId() {
        return TenantContext.getTenantId();
    }

    private String acteurCourant() {
        String email = UserContext.getUserEmail();
        if (StringUtils.hasText(email)) {
            return email;
        }
        UUID userId = UserContext.getUserIdOrNull();
        return userId != null ? userId.toString() : "system";
    }
}
