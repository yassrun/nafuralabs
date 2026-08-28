package ma.nafura.chantiers.service;

import ma.nafura.achats.service.port.NoeudChantierPort;
import ma.nafura.chantiers.domain.budget.PosteBudgetaire;
import ma.nafura.chantiers.domain.chantier.NatureLigne;
import ma.nafura.chantiers.repository.ChantierLotRepository;
import ma.nafura.chantiers.repository.PosteBudgetaireRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * SEKTOR-224 — AC-8 : contrat ST sur un poste vendu, refus INTERNE / hors chantier.
 */
@Component
public class NoeudChantierAdapter implements NoeudChantierPort {

    static final String ERR_NOEUD_REQUIS = "achats.st.noeud_requis";
    static final String ERR_NOEUD_INCONNU = "achats.st.noeud_inconnu";
    static final String ERR_NOEUD_HORS_CHANTIER = "achats.st.noeud_hors_chantier";
    static final String ERR_NOEUD_INTERNE = "achats.st.noeud_interne";

    private final PosteBudgetaireRepository posteRepository;
    private final ChantierLotRepository lotRepository;

    public NoeudChantierAdapter(
            PosteBudgetaireRepository posteRepository, ChantierLotRepository lotRepository) {
        this.posteRepository = posteRepository;
        this.lotRepository = lotRepository;
    }

    @Override
    public void requirePosteVendu(String chantierId, String noeudId) {
        if (!StringUtils.hasText(chantierId) || !StringUtils.hasText(noeudId)) {
            throw new IllegalArgumentException(ERR_NOEUD_REQUIS);
        }
        PosteBudgetaire poste = posteRepository
                .findByIdAndTenantId(noeudId.trim(), TenantContext.getTenantId())
                .orElseThrow(() -> new IllegalArgumentException(ERR_NOEUD_INCONNU + ": " + noeudId));
        lotRepository
                .findByIdAndTenantId(poste.getLotId(), TenantContext.getTenantId())
                .filter(lot -> chantierId.equals(lot.getChantierId()))
                .orElseThrow(() -> new IllegalArgumentException(ERR_NOEUD_HORS_CHANTIER + ": " + noeudId));
        if (poste.getNature() == NatureLigne.INTERNE) {
            throw new IllegalArgumentException(ERR_NOEUD_INTERNE + ": " + noeudId);
        }
    }
}
