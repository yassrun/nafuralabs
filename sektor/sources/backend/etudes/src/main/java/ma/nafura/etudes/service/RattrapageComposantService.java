package ma.nafura.etudes.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import ma.nafura.etudes.api.dto.RattrapageGroupeDto;
import ma.nafura.etudes.api.dto.RattrapageResumeDto;
import ma.nafura.etudes.api.request.RattrapageCreerDto;
import ma.nafura.etudes.api.request.RattrapageIgnorerDto;
import ma.nafura.etudes.api.request.RattrapageRapprocherDto;
import ma.nafura.etudes.domain.appeloffre.ReferenceType;
import ma.nafura.etudes.domain.dpu.ComposantDpu;
import ma.nafura.etudes.domain.dossier.DemandeCreationArticle;
import ma.nafura.etudes.domain.dossier.DossierEtude;
import ma.nafura.etudes.repository.ComposantDpuRepository;
import ma.nafura.etudes.repository.DemandeCreationArticleRepository;
import ma.nafura.etudes.repository.DossierEtudeRepository;
import ma.nafura.catalogue.api.CatalogItemSnapshot;
import ma.nafura.catalogue.api.CatalogLookupApi;
import ma.nafura.catalogue.api.CatalogPriceSnapshot;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.context.UserContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class RattrapageComposantService {

    private final DossierEtudeRepository dossierRepository;
    private final ComposantDpuRepository composantRepository;
    private final DemandeCreationArticleRepository demandeRepository;
    private final CatalogLookupApi catalogLookupApi;
    private final GelPrixComposantService gelPrixService;
    private final ParametresEtudeService parametres;
    private final ObjectMapper objectMapper;

    public RattrapageComposantService(
            DossierEtudeRepository dossierRepository,
            ComposantDpuRepository composantRepository,
            DemandeCreationArticleRepository demandeRepository,
            CatalogLookupApi catalogLookupApi,
            GelPrixComposantService gelPrixService,
            ParametresEtudeService parametres,
            ObjectMapper objectMapper) {
        this.dossierRepository = dossierRepository;
        this.composantRepository = composantRepository;
        this.demandeRepository = demandeRepository;
        this.catalogLookupApi = catalogLookupApi;
        this.gelPrixService = gelPrixService;
        this.parametres = parametres;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public RattrapageResumeDto resume(UUID dossierId) {
        DossierEtude dossier = requireDossier(dossierId);
        List<ComposantDpu> libres = loadLibres(dossier);
        List<RattrapageGroupeDto> groupes = grouper(libres);
        List<DemandeCreationArticle> demandes = demandeRepository
                .findByTenantIdAndDossierEtudeIdOrderByCreatedAtDesc(tenantId(), dossierId)
                .stream()
                .filter(d -> DemandeCreationArticle.STATUT_OUVERTE.equals(d.getStatut()))
                .toList();
        return RattrapageResumeDto.builder()
                .totalLibres(libres.size())
                .groupes(groupes.size())
                .creationArticleMode(parametres.creationArticleMode())
                .groupesDetail(groupes)
                .demandesOuvertes(demandes)
                .build();
    }

    @Transactional
    public int ignorer(UUID dossierId, RattrapageIgnorerDto body) {
        DossierEtude dossier = requireDossierModifiable(dossierId);
        List<ComposantDpu> comps = loadOwnedLibres(dossier, body.getComposantIds());
        for (ComposantDpu c : comps) {
            c.setHorsReferentiel(true);
        }
        composantRepository.saveAll(comps);
        return comps.size();
    }

    @Transactional
    public int rapprocher(UUID dossierId, RattrapageRapprocherDto body) {
        DossierEtude dossier = requireDossierModifiable(dossierId);
        CatalogItemSnapshot item = catalogLookupApi
                .getItem(body.getItemId())
                .orElseThrow(() -> new IllegalArgumentException("etudes.rattrapage.item_introuvable"));
        List<ComposantDpu> comps = loadOwnedLibres(dossier, body.getComposantIds());
        lierVersItem(comps, UUID.fromString(item.itemId()), item.name());
        return comps.size();
    }

    /**
     * Mode LIBRE : crée l'article allégé et lie le groupe.
     * Mode CONTROLEE : enregistre une demande, laisse les composants en LIBRE.
     */
    @Transactional
    public Object creerOuDemander(UUID dossierId, RattrapageCreerDto body) {
        DossierEtude dossier = requireDossierModifiable(dossierId);
        List<ComposantDpu> comps = loadOwnedLibres(dossier, body.getComposantIds());
        if (comps.isEmpty()) {
            throw new IllegalArgumentException("etudes.rattrapage.composants_introuvables");
        }
        if (parametres.creationArticleControlee()) {
            return creerDemande(dossier, body, comps);
        }
        CatalogItemSnapshot item = catalogLookupApi.createAllege(body.getLibelle(), body.getNature(), body.getUomCode());
        lierVersItem(comps, UUID.fromString(item.itemId()), item.name());
        return Map.of(
                "itemId", UUID.fromString(item.itemId()),
                "name", item.name(),
                "aCompleter", Boolean.TRUE,
                "composantsLies", comps.size());
    }

    private DemandeCreationArticle creerDemande(
            DossierEtude dossier, RattrapageCreerDto body, List<ComposantDpu> comps) {
        UUID userId = UserContext.getUserIdOrNull();
        DemandeCreationArticle demande = DemandeCreationArticle.builder()
                .tenantId(tenantId())
                .dossierEtudeId(dossier.getId())
                .libelle(body.getLibelle().trim())
                .nature(body.getNature().trim())
                .uomCode(StringUtils.hasText(body.getUomCode()) ? body.getUomCode().trim() : null)
                .statut(DemandeCreationArticle.STATUT_OUVERTE)
                .auteurUserId(userId != null ? userId.toString() : null)
                .composantIdsJson(toJson(comps.stream().map(ComposantDpu::getId).toList()))
                .build();
        return demandeRepository.save(demande);
    }

    private void lierVersItem(List<ComposantDpu> comps, UUID itemId, String itemName) {
        CatalogPriceSnapshot resolu = gelPrixService.resoudre(itemId);
        for (ComposantDpu c : comps) {
            c.setReferenceType(ReferenceType.ITEM.name());
            c.setItemId(itemId);
            c.setOuvrageId(null);
            c.setHorsReferentiel(false);
            if (StringUtils.hasText(itemName)) {
                c.setLibelle(itemName);
            }
            if (resolu != null && resolu.unitPrice() != null) {
                gelPrixService.appliquerGel(c, resolu);
                BigDecimal rendement = c.getRendement() != null ? c.getRendement() : BigDecimal.ZERO;
                c.setTotal(rendement.multiply(resolu.unitPrice()));
            }
        }
        composantRepository.saveAll(comps);
    }

    private List<ComposantDpu> loadLibres(DossierEtude dossier) {
        if (dossier.getDpgfId() == null) {
            return List.of();
        }
        return composantRepository.findLibresRattrapage(tenantId(), dossier.getDpgfId());
    }

    private List<ComposantDpu> loadOwnedLibres(DossierEtude dossier, List<UUID> ids) {
        if (ids == null || ids.isEmpty()) {
            throw new IllegalArgumentException("etudes.rattrapage.composants_requis");
        }
        List<ComposantDpu> all = loadLibres(dossier);
        Map<UUID, ComposantDpu> byId = new LinkedHashMap<>();
        for (ComposantDpu c : all) {
            byId.put(c.getId(), c);
        }
        List<ComposantDpu> selected = new ArrayList<>();
        for (UUID id : ids) {
            ComposantDpu c = byId.get(id);
            if (c != null) {
                selected.add(c);
            }
        }
        if (selected.isEmpty()) {
            throw new IllegalArgumentException("etudes.rattrapage.composants_introuvables");
        }
        return selected;
    }

    static List<RattrapageGroupeDto> grouper(List<ComposantDpu> libres) {
        Map<String, List<ComposantDpu>> buckets = new LinkedHashMap<>();
        for (ComposantDpu c : libres) {
            String key = normalizeLibelle(c.getLibelle());
            buckets.computeIfAbsent(key, k -> new ArrayList<>()).add(c);
        }
        List<RattrapageGroupeDto> out = new ArrayList<>();
        for (Map.Entry<String, List<ComposantDpu>> e : buckets.entrySet()) {
            List<ComposantDpu> group = e.getValue();
            String display = group.stream()
                    .map(ComposantDpu::getLibelle)
                    .filter(StringUtils::hasText)
                    .findFirst()
                    .orElse(e.getKey());
            out.add(RattrapageGroupeDto.builder()
                    .libelle(display)
                    .libelleNormalise(e.getKey())
                    .count(group.size())
                    .composantIds(group.stream().map(ComposantDpu::getId).toList())
                    .noeudIds(group.stream()
                            .map(c -> c.getPrixDpu() != null ? c.getPrixDpu().getDpgfNoeudId() : null)
                            .filter(id -> id != null)
                            .distinct()
                            .toList())
                    .build());
        }
        return out;
    }

    static String normalizeLibelle(String libelle) {
        if (libelle == null) {
            return "";
        }
        return libelle.trim().toLowerCase(Locale.ROOT).replaceAll("\\s+", " ");
    }

    private DossierEtude requireDossier(UUID dossierId) {
        return dossierRepository
                .findByIdAndTenantId(dossierId, tenantId())
                .orElseThrow(() -> new IllegalArgumentException("etudes.dossier.introuvable"));
    }

    private DossierEtude requireDossierModifiable(UUID dossierId) {
        DossierEtude dossier = requireDossier(dossierId);
        if (!dossier.isModifiable()) {
            throw new IllegalStateException("etudes.dossier.non_modifiable");
        }
        return dossier;
    }

    private String toJson(List<UUID> ids) {
        try {
            return objectMapper.writeValueAsString(ids);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("etudes.rattrapage.serialize_ids", ex);
        }
    }

    @SuppressWarnings("unused")
    private List<UUID> fromJson(String json) {
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (JsonProcessingException ex) {
            return List.of();
        }
    }

    private UUID tenantId() {
        return TenantContext.getTenantId();
    }
}
