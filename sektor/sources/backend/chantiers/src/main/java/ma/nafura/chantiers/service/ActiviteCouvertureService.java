package ma.nafura.chantiers.service;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import ma.nafura.chantiers.domain.activite.ActiviteRattachement;
import ma.nafura.chantiers.repository.ActiviteRattachementRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * AC-8 — un nœud couvert par ≥1 activité refuse la déclaration directe.
 * Palier 1 : aucune activité → liste vide → comportement inchangé (AC-11).
 */
@Service
public class ActiviteCouvertureService {

    private final ActiviteRattachementRepository rattachementRepository;

    public ActiviteCouvertureService(ActiviteRattachementRepository rattachementRepository) {
        this.rattachementRepository = rattachementRepository;
    }

    /**
     * @return les identifiants des activités qui couvrent ce nœud (poste ou lot-feuille).
     */
    public List<String> activitesCouvrant(String noeudId) {
        if (!StringUtils.hasText(noeudId)) {
            return List.of();
        }
        UUID tenantId = TenantContext.getTenantId();
        Set<String> ids = new LinkedHashSet<>();
        for (ActiviteRattachement r : rattachementRepository.findByTenantIdAndPosteId(tenantId, noeudId)) {
            ids.add(r.getActiviteId());
        }
        for (ActiviteRattachement r :
                rattachementRepository.findByTenantIdAndLotIdAndPosteIdIsNull(tenantId, noeudId)) {
            ids.add(r.getActiviteId());
        }
        return new ArrayList<>(ids);
    }
}
