package ma.nafura.etudes.service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import ma.nafura.achats.domain.consultation.ConsultationAchat;
import ma.nafura.achats.domain.consultation.ConsultationAchatDevis;
import ma.nafura.achats.domain.consultation.ConsultationAchatDevisLigne;
import ma.nafura.achats.repository.ConsultationAchatDevisRepository;
import ma.nafura.achats.repository.ConsultationAchatRepository;
import ma.nafura.achats.service.port.ConsultationLienEtudePort;
import ma.nafura.catalogue.api.CatalogItemSnapshot;
import ma.nafura.catalogue.api.CatalogLookupApi;
import ma.nafura.etudes.domain.dossier.DossierEtude;
import ma.nafura.etudes.repository.DossierEtudeRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * Liée : N devis extraits qui couvrent une {@code cle_stable} du panier → CONSULTÉ + PU
 * sur tous les postes de cette identité. Hors étude : le port n'est pas appelé.
 */
@Service
@Primary
public class ConsultationAchatFlagService implements ConsultationLienEtudePort {

    private static final Logger log = LoggerFactory.getLogger(ConsultationAchatFlagService.class);

    private final ConsultationAchatRepository consultationRepository;
    private final ConsultationAchatDevisRepository devisRepository;
    private final DossierEtudeRepository dossierRepository;
    private final CatalogLookupApi catalogLookupApi;
    private final DpuService dpuService;
    private final ParametresEtudeService parametres;

    public ConsultationAchatFlagService(
            ConsultationAchatRepository consultationRepository,
            ConsultationAchatDevisRepository devisRepository,
            DossierEtudeRepository dossierRepository,
            CatalogLookupApi catalogLookupApi,
            @Lazy DpuService dpuService,
            ParametresEtudeService parametres) {
        this.consultationRepository = consultationRepository;
        this.devisRepository = devisRepository;
        this.dossierRepository = dossierRepository;
        this.catalogLookupApi = catalogLookupApi;
        this.dpuService = dpuService;
        this.parametres = parametres;
    }

    @Override
    @Transactional
    public void appliquerFlagsApresDevis(UUID dossierEtudeId) {
        if (dossierEtudeId == null) {
            return;
        }
        DossierEtude dossier = dossierRepository
                .findByIdAndTenantId(dossierEtudeId, tenantId())
                .orElse(null);
        if (dossier == null || dossier.getDpgfId() == null) {
            return;
        }

        List<ConsultationAchat> liees =
                consultationRepository.findByTenantIdAndDossierEtudeId(tenantId(), dossierEtudeId);
        if (liees.isEmpty()) {
            return;
        }

        Set<String> panier = new LinkedHashSet<>();
        List<UUID> consultationIds = new ArrayList<>();
        for (ConsultationAchat consultation : liees) {
            if (consultation.getId() != null) {
                consultationIds.add(consultation.getId());
            }
            if (consultation.getClesStables() == null) {
                continue;
            }
            for (String raw : consultation.getClesStables()) {
                String cle = normalizeCle(raw);
                if (cle != null) {
                    panier.add(cle);
                }
            }
        }
        if (panier.isEmpty() || consultationIds.isEmpty()) {
            return;
        }

        List<ConsultationAchatDevis> devis = devisRepository.findByConsultationIdIn(consultationIds);
        Map<String, List<Offre>> parCle = new HashMap<>();
        for (ConsultationAchatDevis recu : devis) {
            if (recu.getLignes() == null) {
                continue;
            }
            Set<String> vues = new LinkedHashSet<>();
            for (ConsultationAchatDevisLigne ligne : recu.getLignes()) {
                if (ligne == null || ligne.getPrixUnitaire() == null) {
                    continue;
                }
                String cle = normalizeCle(ligne.getIdentite());
                if (cle == null || !vues.add(cle)) {
                    continue;
                }
                parCle.computeIfAbsent(cle, k -> new ArrayList<>())
                        .add(new Offre(recu.getId(), ligne.getPrixUnitaire()));
            }
        }

        int minN = Math.max(1, parametres.consultationMinimum());
        for (String cle : panier) {
            List<Offre> couvrant = parCle.getOrDefault(cle, List.of());
            if (couvrant.size() < minN) {
                continue;
            }
            Offre meilleure = meilleure(couvrant);
            CatalogItemSnapshot item = catalogLookupApi.findByCleStable(cle).orElse(null);
            if (item == null || !StringUtils.hasText(item.itemId())) {
                log.info("consultation.achat.flag.sans_item cle={}", cle);
                continue;
            }
            try {
                dpuService.appliquerPrixConsulte(
                        dossier.getDpgfId(),
                        UUID.fromString(item.itemId()),
                        meilleure.prixUnitaire(),
                        meilleure.devisId(),
                        "Consultation — " + cle);
            } catch (RuntimeException ex) {
                log.warn("consultation.achat.flag.echec cle={} {}", cle, ex.getMessage());
            }
        }
    }

    private static Offre meilleure(List<Offre> offres) {
        Offre best = offres.get(0);
        for (int i = 1; i < offres.size(); i++) {
            if (offres.get(i).prixUnitaire().compareTo(best.prixUnitaire()) < 0) {
                best = offres.get(i);
            }
        }
        return best;
    }

    private static String normalizeCle(String raw) {
        if (!StringUtils.hasText(raw)) {
            return null;
        }
        return raw.trim().toLowerCase(Locale.ROOT);
    }

    private static UUID tenantId() {
        return TenantContext.getTenantId();
    }

    private record Offre(UUID devisId, BigDecimal prixUnitaire) {}
}
