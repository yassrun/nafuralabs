package ma.nafura.etudes.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.etudes.api.request.DpgfLotAffectationRequest;
import ma.nafura.etudes.domain.dossier.DossierEtude;
import ma.nafura.etudes.domain.dpgf.DpgfNoeud;
import ma.nafura.etudes.domain.dpu.PrixDpu;
import ma.nafura.etudes.repository.DossierEtudeRepository;
import ma.nafura.etudes.repository.DpgfNoeudRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * Affectation d'un LOT à un ingénieur BTP, et filtre de l'arbre pour cet ingénieur.
 */
@Service
public class DpgfLotAffectationService {

    private final DpgfNoeudRepository noeudRepository;
    private final DossierEtudeRepository dossierEtudeRepository;
    private final ChargeEtudeService chargeEtudeService;
    private final EtudeSaisiePolicy saisiePolicy;

    public DpgfLotAffectationService(
            DpgfNoeudRepository noeudRepository,
            DossierEtudeRepository dossierEtudeRepository,
            ChargeEtudeService chargeEtudeService,
            EtudeSaisiePolicy saisiePolicy) {
        this.noeudRepository = noeudRepository;
        this.dossierEtudeRepository = dossierEtudeRepository;
        this.chargeEtudeService = chargeEtudeService;
        this.saisiePolicy = saisiePolicy;
    }

    @Transactional
    public DpgfNoeud affecter(UUID noeudId, DpgfLotAffectationRequest request) {
        UUID tenantId = tenantId();
        DpgfNoeud noeud = requireNoeud(noeudId, tenantId);
        if (!DpgfNoeud.TYPE_LOT.equals(noeud.getType())) {
            throw new IllegalArgumentException("etudes.lot.affectation_lot_uniquement");
        }
        DossierEtude dossier = dossierDuNoeud(noeud, tenantId).orElse(null);
        if (dossier != null) {
            if (!dossier.isModifiable()) {
                throw new IllegalStateException("etudes.dossier.verrouille");
            }
            saisiePolicy.assertPeutAffecterLots(dossier);
        } else if (!saisiePolicy.peutDeciderGo()) {
            throw new IllegalStateException("etudes.lot.affectation_reservee_charge");
        }

        if (request == null || !StringUtils.hasText(request.getUserId())) {
            noeud.setChargeLotUserId(null);
            noeud.setChargeLotNom(null);
            return noeudRepository.save(noeud);
        }
        String nom = chargeEtudeService.requireIngenieur(request.getUserId().trim(), request.getNom());
        noeud.setChargeLotUserId(request.getUserId().trim());
        noeud.setChargeLotNom(nom);
        return noeudRepository.save(noeud);
    }

    public boolean voitToutArbre(DossierEtude dossier) {
        return saisiePolicy.peutDeciderGo() || saisiePolicy.estChargeEtudeCourant(dossier);
    }

    public List<DpgfNoeud> filtrerArbre(List<DpgfNoeud> roots, DossierEtude dossier) {
        if (roots == null || roots.isEmpty() || voitToutArbre(dossier)) {
            return roots == null ? List.of() : roots;
        }
        List<DpgfNoeud> visibles = new ArrayList<>();
        for (DpgfNoeud root : roots) {
            DpgfNoeud lot = DpgfNoeud.TYPE_LOT.equals(root.getType()) ? root : null;
            if (lot != null && saisiePolicy.estActeurCourant(lot.getChargeLotUserId())) {
                visibles.add(root);
            }
        }
        return visibles;
    }

    public void assertPeutSaisirNoeud(DpgfNoeud noeud) {
        if (noeud == null) {
            return;
        }
        UUID tenantId = tenantId();
        Optional<DossierEtude> dossierOpt = dossierDuNoeud(noeud, tenantId);
        if (dossierOpt.isEmpty()) {
            return;
        }
        DossierEtude dossier = dossierOpt.get();
        if (!dossier.isModifiable()) {
            throw new IllegalStateException("etudes.dossier.verrouille");
        }
        DpgfNoeud lot = lotAncetre(noeud, tenantId);
        if (lot != null && StringUtils.hasText(lot.getChargeLotUserId())) {
            if (saisiePolicy.estActeurCourant(lot.getChargeLotUserId())) {
                return;
            }
            throw new IllegalStateException("etudes.lot.saisie_reservee_affecte");
        }
        if (saisiePolicy.peutDeciderGo() || saisiePolicy.estChargeEtudeCourant(dossier)) {
            return;
        }
        throw new IllegalStateException("etudes.dossier.saisie_reservee_charge");
    }

    public void assertPeutSaisirPrixDpu(PrixDpu dpu) {
        if (dpu == null || dpu.getDpgfNoeudId() == null) {
            return;
        }
        noeudRepository
                .findByIdAndTenantId(dpu.getDpgfNoeudId(), tenantId())
                .ifPresent(this::assertPeutSaisirNoeud);
    }

    private DpgfNoeud lotAncetre(DpgfNoeud noeud, UUID tenantId) {
        DpgfNoeud courant = noeud;
        int garde = 0;
        while (courant != null && garde++ < 32) {
            if (DpgfNoeud.TYPE_LOT.equals(courant.getType())) {
                return courant;
            }
            if (courant.getParentId() == null) {
                return null;
            }
            courant = noeudRepository
                    .findByIdAndTenantId(courant.getParentId(), tenantId)
                    .orElse(null);
        }
        return null;
    }

    private Optional<DossierEtude> dossierDuNoeud(DpgfNoeud noeud, UUID tenantId) {
        if (noeud.getDpgf() == null || noeud.getDpgf().getId() == null) {
            return Optional.empty();
        }
        return dossierEtudeRepository.findByTenantIdAndDpgfId(tenantId, noeud.getDpgf().getId());
    }

    private DpgfNoeud requireNoeud(UUID noeudId, UUID tenantId) {
        return noeudRepository
                .findByIdAndTenantId(noeudId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("etudes.dpgf.noeud_introuvable"));
    }

    private UUID tenantId() {
        UUID id = TenantContext.getTenantId();
        if (id == null) {
            throw new IllegalStateException("etudes.tenant_manquant");
        }
        return id;
    }
}
