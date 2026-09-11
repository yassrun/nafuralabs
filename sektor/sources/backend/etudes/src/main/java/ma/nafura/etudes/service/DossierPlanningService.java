package ma.nafura.etudes.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import ma.nafura.etudes.api.request.DossierPlanningActiviteRequest;
import ma.nafura.etudes.api.request.DossierPlanningRessourceRequest;
import ma.nafura.etudes.domain.dossier.DossierEtude;
import ma.nafura.etudes.domain.dpgf.DpgfNoeud;
import ma.nafura.etudes.domain.planning.DossierPlanningActivite;
import ma.nafura.etudes.domain.planning.DossierPlanningRessource;
import ma.nafura.etudes.repository.DossierEtudeRepository;
import ma.nafura.etudes.repository.DossierPlanningActiviteRepository;
import ma.nafura.etudes.repository.DossierPlanningRessourceRepository;
import ma.nafura.etudes.repository.DpgfNoeudRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class DossierPlanningService {

    private final DossierEtudeRepository dossierRepository;
    private final DossierPlanningActiviteRepository activiteRepository;
    private final DossierPlanningRessourceRepository ressourceRepository;
    private final DpgfNoeudRepository noeudRepository;
    private final EtudeSaisiePolicy saisiePolicy;

    public DossierPlanningService(
            DossierEtudeRepository dossierRepository,
            DossierPlanningActiviteRepository activiteRepository,
            DossierPlanningRessourceRepository ressourceRepository,
            DpgfNoeudRepository noeudRepository,
            EtudeSaisiePolicy saisiePolicy) {
        this.dossierRepository = dossierRepository;
        this.activiteRepository = activiteRepository;
        this.ressourceRepository = ressourceRepository;
        this.noeudRepository = noeudRepository;
        this.saisiePolicy = saisiePolicy;
    }

    @Transactional(readOnly = true)
    public List<DossierPlanningActivite> listerActivites(UUID dossierId) {
        requireDossier(dossierId);
        return activiteRepository.findByTenantIdAndDossierIdOrderByOrdreAscCreatedAtAsc(
                tenantId(), dossierId);
    }

    @Transactional
    public DossierPlanningActivite creerActivite(UUID dossierId, DossierPlanningActiviteRequest dto) {
        DossierEtude dossier = requireDossierPourSaisie(dossierId);
        validerDates(dto.getDateDebut(), dto.getDateFin());
        LotRef lot = resoudreLot(dossier, dto.getDpgfNoeudId(), dto.getLotLibelle());
        int ordre = activiteRepository
                .findByTenantIdAndDossierIdOrderByOrdreAscCreatedAtAsc(tenantId(), dossierId)
                .size();
        DossierPlanningActivite row = DossierPlanningActivite.builder()
                .tenantId(tenantId())
                .dossierId(dossierId)
                .dpgfNoeudId(lot.noeudId())
                .lotLibelle(lot.libelle())
                .libelle(dto.getLibelle().trim())
                .dateDebut(dto.getDateDebut())
                .dateFin(dto.getDateFin())
                .ordre(ordre)
                .build();
        return activiteRepository.save(row);
    }

    @Transactional
    public DossierPlanningActivite modifierActivite(
            UUID dossierId, UUID activiteId, DossierPlanningActiviteRequest dto) {
        DossierEtude dossier = requireDossierPourSaisie(dossierId);
        validerDates(dto.getDateDebut(), dto.getDateFin());
        DossierPlanningActivite row = activiteRepository
                .findByIdAndTenantIdAndDossierId(activiteId, tenantId(), dossierId)
                .orElseThrow(() -> new IllegalArgumentException("etudes.planning.activite_introuvable"));
        LotRef lot = resoudreLot(dossier, dto.getDpgfNoeudId(), dto.getLotLibelle());
        row.setLibelle(dto.getLibelle().trim());
        row.setDpgfNoeudId(lot.noeudId());
        row.setLotLibelle(lot.libelle());
        row.setDateDebut(dto.getDateDebut());
        row.setDateFin(dto.getDateFin());
        return activiteRepository.save(row);
    }

    @Transactional
    public void supprimerActivite(UUID dossierId, UUID activiteId) {
        requireDossierPourSaisie(dossierId);
        DossierPlanningActivite row = activiteRepository
                .findByIdAndTenantIdAndDossierId(activiteId, tenantId(), dossierId)
                .orElseThrow(() -> new IllegalArgumentException("etudes.planning.activite_introuvable"));
        activiteRepository.delete(row);
    }

    @Transactional(readOnly = true)
    public List<DossierPlanningRessource> listerRessources(UUID dossierId) {
        requireDossier(dossierId);
        return ressourceRepository.findByTenantIdAndDossierIdOrderByTypeAscOrdreAscCreatedAtAsc(
                tenantId(), dossierId);
    }

    @Transactional
    public DossierPlanningRessource creerRessource(
            UUID dossierId, DossierPlanningRessourceRequest dto) {
        requireDossierPourSaisie(dossierId);
        String type = normaliserType(dto.getType());
        BigDecimal quantite = dto.getQuantite();
        if (quantite == null || quantite.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("etudes.planning.quantite_invalide");
        }
        int ordre = ressourceRepository
                .findByTenantIdAndDossierIdOrderByTypeAscOrdreAscCreatedAtAsc(tenantId(), dossierId)
                .size();
        DossierPlanningRessource row = DossierPlanningRessource.builder()
                .tenantId(tenantId())
                .dossierId(dossierId)
                .type(type)
                .libelle(dto.getLibelle().trim())
                .quantite(quantite)
                .unite(trimOrNull(dto.getUnite()))
                .employeId(trimOrNull(dto.getEmployeId()))
                .materielId(trimOrNull(dto.getMaterielId()))
                .notes(trimOrNull(dto.getNotes()))
                .ordre(ordre)
                .build();
        return ressourceRepository.save(row);
    }

    @Transactional
    public DossierPlanningRessource modifierRessource(
            UUID dossierId, UUID ressourceId, DossierPlanningRessourceRequest dto) {
        requireDossierPourSaisie(dossierId);
        DossierPlanningRessource row = ressourceRepository
                .findByIdAndTenantIdAndDossierId(ressourceId, tenantId(), dossierId)
                .orElseThrow(() -> new IllegalArgumentException("etudes.planning.ressource_introuvable"));
        BigDecimal quantite = dto.getQuantite();
        if (quantite == null || quantite.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("etudes.planning.quantite_invalide");
        }
        row.setType(normaliserType(dto.getType()));
        row.setLibelle(dto.getLibelle().trim());
        row.setQuantite(quantite);
        row.setUnite(trimOrNull(dto.getUnite()));
        row.setEmployeId(trimOrNull(dto.getEmployeId()));
        row.setMaterielId(trimOrNull(dto.getMaterielId()));
        row.setNotes(trimOrNull(dto.getNotes()));
        return ressourceRepository.save(row);
    }

    @Transactional
    public void supprimerRessource(UUID dossierId, UUID ressourceId) {
        requireDossierPourSaisie(dossierId);
        DossierPlanningRessource row = ressourceRepository
                .findByIdAndTenantIdAndDossierId(ressourceId, tenantId(), dossierId)
                .orElseThrow(() -> new IllegalArgumentException("etudes.planning.ressource_introuvable"));
        ressourceRepository.delete(row);
    }

    private DossierEtude requireDossier(UUID dossierId) {
        return dossierRepository
                .findByIdAndTenantId(dossierId, tenantId())
                .orElseThrow(() -> new IllegalArgumentException("etudes.dossier.introuvable"));
    }

    private DossierEtude requireDossierPourSaisie(UUID dossierId) {
        DossierEtude dossier = requireDossier(dossierId);
        if (!dossier.getStatus().estModifiable()) {
            throw new IllegalStateException("etudes.dossier.verrouille");
        }
        saisiePolicy.assertPeutSaisirApresGo(dossier);
        return dossier;
    }

    private LotRef resoudreLot(DossierEtude dossier, UUID dpgfNoeudId, String lotLibelle) {
        if (dpgfNoeudId == null) {
            return new LotRef(null, trimOrNull(lotLibelle));
        }
        DpgfNoeud noeud = noeudRepository
                .findByIdAndTenantId(dpgfNoeudId, tenantId())
                .orElseThrow(() -> new IllegalArgumentException("etudes.planning.lot_introuvable"));
        if (!DpgfNoeud.TYPE_LOT.equals(noeud.getType())
                && !DpgfNoeud.TYPE_SOUS_LOT.equals(noeud.getType())) {
            throw new IllegalArgumentException("etudes.planning.lot_pas_lot");
        }
        if (dossier.getDpgfId() != null
                && noeud.getDpgf() != null
                && !dossier.getDpgfId().equals(noeud.getDpgf().getId())) {
            throw new IllegalArgumentException("etudes.planning.lot_hors_dossier");
        }
        String label = StringUtils.hasText(lotLibelle)
                ? lotLibelle.trim()
                : ((noeud.getCode() != null ? noeud.getCode() + " — " : "") + noeud.getLibelle());
        return new LotRef(noeud.getId(), label);
    }

    private static void validerDates(LocalDate debut, LocalDate fin) {
        if (debut == null || fin == null) {
            throw new IllegalArgumentException("etudes.planning.dates_requises");
        }
        if (fin.isBefore(debut)) {
            throw new IllegalArgumentException("etudes.planning.dates_invalides");
        }
    }

    private static String normaliserType(String type) {
        if (DossierPlanningRessource.TYPE_HUMAIN.equalsIgnoreCase(type)) {
            return DossierPlanningRessource.TYPE_HUMAIN;
        }
        if (DossierPlanningRessource.TYPE_MATERIEL.equalsIgnoreCase(type)) {
            return DossierPlanningRessource.TYPE_MATERIEL;
        }
        throw new IllegalArgumentException("etudes.planning.type_invalide");
    }

    private UUID tenantId() {
        return TenantContext.getTenantId();
    }

    private static String trimOrNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private record LotRef(UUID noeudId, String libelle) {}
}
