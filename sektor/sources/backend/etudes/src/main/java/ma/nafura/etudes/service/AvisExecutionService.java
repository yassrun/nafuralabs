package ma.nafura.etudes.service;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import ma.nafura.etudes.api.dto.AvisExecutionResumeDto;
import ma.nafura.etudes.api.request.AvisExecutionCreateDto;
import ma.nafura.etudes.api.request.AvisExecutionTraiterDto;
import ma.nafura.etudes.domain.NiveauAvisExecution;
import ma.nafura.etudes.domain.StatutAvisExecution;
import ma.nafura.etudes.domain.model.AvisExecution;
import ma.nafura.etudes.domain.model.DossierEtude;
import ma.nafura.etudes.domain.model.DpgfNoeud;
import ma.nafura.etudes.repository.AvisExecutionRepository;
import ma.nafura.etudes.repository.DossierEtudeRepository;
import ma.nafura.etudes.repository.DpgfNoeudRepository;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.context.UserContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class AvisExecutionService {

    private final AvisExecutionRepository repository;
    private final DossierEtudeRepository dossierRepository;
    private final DpgfNoeudRepository noeudRepository;
    private final DossierIntervenantService intervenantService;

    public AvisExecutionService(
            AvisExecutionRepository repository,
            DossierEtudeRepository dossierRepository,
            DpgfNoeudRepository noeudRepository,
            DossierIntervenantService intervenantService) {
        this.repository = repository;
        this.dossierRepository = dossierRepository;
        this.noeudRepository = noeudRepository;
        this.intervenantService = intervenantService;
    }

    @Transactional(readOnly = true)
    public List<AvisExecution> lister(UUID dossierId, UUID noeudId) {
        requireDossier(dossierId);
        if (noeudId != null) {
            return repository.findByTenantIdAndDossierEtudeIdAndDpgfNoeudIdOrderByCreatedAtDesc(
                    tenantId(), dossierId, noeudId);
        }
        return repository.findByTenantIdAndDossierEtudeIdOrderByCreatedAtDesc(tenantId(), dossierId);
    }

    @Transactional(readOnly = true)
    public AvisExecutionResumeDto resume(UUID dossierId) {
        requireDossier(dossierId);
        UUID tenant = tenantId();
        long ouverts = repository.countByTenantIdAndDossierEtudeIdAndStatut(
                tenant, dossierId, StatutAvisExecution.OUVERT.name());
        long ecartes = repository.countByTenantIdAndDossierEtudeIdAndStatut(
                tenant, dossierId, StatutAvisExecution.ECARTE.name());
        long pris = repository.countByTenantIdAndDossierEtudeIdAndStatut(
                tenant, dossierId, StatutAvisExecution.PRIS_EN_COMPTE.name());
        return AvisExecutionResumeDto.builder()
                .ouverts(ouverts)
                .ecartes(ecartes)
                .prisEnCompte(pris)
                .total(ouverts + ecartes + pris)
                .build();
    }

    @Transactional
    public AvisExecution creer(UUID dossierId, AvisExecutionCreateDto dto) {
        DossierEtude dossier = requireDossier(dossierId);
        NiveauAvisExecution niveau = NiveauAvisExecution.from(dto.getNiveau());
        if (niveau == null) {
            throw new IllegalArgumentException("etudes.avis.niveau_invalide");
        }
        if (niveau.exigeCommentaire() && !StringUtils.hasText(dto.getCommentaire())) {
            throw new IllegalArgumentException("etudes.avis.commentaire_obligatoire");
        }
        if (dto.getDpgfNoeudId() == null) {
            throw new IllegalArgumentException("etudes.avis.noeud_requis");
        }
        DpgfNoeud noeud = noeudRepository
                .findByIdAndTenantId(dto.getDpgfNoeudId(), tenantId())
                .orElseThrow(() -> new IllegalArgumentException("etudes.avis.noeud_introuvable"));
        if (!DpgfNoeud.TYPE_ARTICLE.equals(noeud.getType())) {
            throw new IllegalArgumentException("etudes.avis.noeud_pas_article");
        }
        if (dossier.getDpgfId() != null
                && noeud.getDpgf() != null
                && !dossier.getDpgfId().equals(noeud.getDpgf().getId())) {
            throw new IllegalArgumentException("etudes.avis.noeud_hors_dossier");
        }

        String userId = currentUserId();
        String nom = currentUserLabel();
        AvisExecution avis = AvisExecution.builder()
                .tenantId(tenantId())
                .dossierEtudeId(dossierId)
                .dpgfNoeudId(dto.getDpgfNoeudId())
                .niveau(niveau.name())
                .commentaire(trimOrNull(dto.getCommentaire()))
                .ecartPropose(dto.getEcartPropose())
                .auteurUserId(userId)
                .auteurNom(nom)
                .statut(StatutAvisExecution.OUVERT.name())
                .build();
        AvisExecution saved = repository.save(avis);
        intervenantService.enregistrerAvis(dossierId, userId, nom, false);
        return saved;
    }

    @Transactional
    public AvisExecution traiter(UUID dossierId, UUID avisId, AvisExecutionTraiterDto dto) {
        requireDossier(dossierId);
        AvisExecution avis = repository
                .findByIdAndTenantIdAndDossierEtudeId(avisId, tenantId(), dossierId)
                .orElseThrow(() -> new IllegalArgumentException("etudes.avis.introuvable"));
        if (!StatutAvisExecution.OUVERT.name().equals(avis.getStatut())) {
            throw new IllegalStateException("etudes.avis.deja_traite");
        }
        StatutAvisExecution cible = StatutAvisExecution.from(dto.getStatut());
        if (cible == null
                || cible == StatutAvisExecution.OUVERT) {
            throw new IllegalArgumentException("etudes.avis.statut_invalide");
        }
        if (cible == StatutAvisExecution.ECARTE && !StringUtils.hasText(dto.getMotifTraitement())) {
            throw new IllegalArgumentException("etudes.avis.motif_obligatoire");
        }
        avis.setStatut(cible.name());
        avis.setMotifTraitement(
                cible == StatutAvisExecution.ECARTE ? trimOrNull(dto.getMotifTraitement()) : null);
        avis.setTraitePar(currentUserId());
        avis.setTraiteLe(OffsetDateTime.now());
        return repository.save(avis);
    }

    private DossierEtude requireDossier(UUID dossierId) {
        return dossierRepository
                .findByIdAndTenantId(dossierId, tenantId())
                .orElseThrow(() -> new IllegalArgumentException("etudes.dossier.introuvable"));
    }

    private UUID tenantId() {
        return TenantContext.getTenantId();
    }

    private static String currentUserId() {
        UUID id = UserContext.getUserIdOrNull();
        if (id != null) {
            return id.toString();
        }
        String email = UserContext.getUserEmail();
        return StringUtils.hasText(email) ? email.trim() : "system";
    }

    private static String currentUserLabel() {
        String email = UserContext.getUserEmail();
        if (StringUtils.hasText(email)) {
            return email.trim();
        }
        return currentUserId();
    }

    private static String trimOrNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
