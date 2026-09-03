package ma.nafura.achats.service;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.Year;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import ma.nafura.achats.api.dto.ConsultationAchatDto;
import ma.nafura.achats.api.dto.ConsultationDestinataireDto;
import ma.nafura.achats.api.dto.ConsultationDevisDto;
import ma.nafura.achats.api.dto.ConsultationDevisLigneDto;
import ma.nafura.achats.api.dto.ConsultationEnvoiDto;
import ma.nafura.achats.api.request.ConsultationAchatCreateDto;
import ma.nafura.achats.api.request.ConsultationAchatPanierDto;
import ma.nafura.achats.api.request.ConsultationDestinataireCreateDto;
import ma.nafura.achats.api.request.ConsultationDevisImportDto;
import ma.nafura.achats.domain.consultation.ConsultationAchat;
import ma.nafura.achats.domain.consultation.ConsultationAchatDestinataire;
import ma.nafura.achats.domain.consultation.ConsultationAchatDevis;
import ma.nafura.achats.domain.consultation.ConsultationAchatDevisLigne;
import ma.nafura.achats.domain.consultation.ConsultationAchatEnvoi;
import ma.nafura.achats.domain.fournisseur.Partner;
import ma.nafura.achats.domain.fournisseur.PartnerContact;
import ma.nafura.achats.domain.fournisseur.PartnerRoleType;
import ma.nafura.achats.repository.ConsultationAchatDestinataireRepository;
import ma.nafura.achats.repository.ConsultationAchatDevisRepository;
import ma.nafura.achats.repository.ConsultationAchatEnvoiRepository;
import ma.nafura.achats.repository.ConsultationAchatRepository;
import ma.nafura.achats.repository.PartnerContactRepository;
import ma.nafura.achats.repository.PartnerRepository;
import ma.nafura.achats.repository.PartnerRoleRepository;
import ma.nafura.achats.service.port.ConsultationLienEtudePort;
import ma.nafura.catalogue.api.CatalogItemSnapshot;
import ma.nafura.catalogue.api.CatalogLookupApi;
import ma.nafura.platform.collaboration.notification.service.EmailService;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Slf4j
@Service
public class ConsultationAchatService {

    private final ConsultationAchatRepository repository;
    private final ConsultationAchatDevisRepository devisRepository;
    private final ConsultationAchatDestinataireRepository destinataireRepository;
    private final ConsultationAchatEnvoiRepository envoiRepository;
    private final PartnerRepository partnerRepository;
    private final PartnerRoleRepository roleRepository;
    private final PartnerContactRepository contactRepository;
    private final ObjectProvider<ConsultationLienEtudePort> lienEtudePort;
    private final ObjectProvider<EmailService> emailService;
    private final ObjectProvider<CatalogLookupApi> catalogLookup;

    public ConsultationAchatService(
            ConsultationAchatRepository repository,
            ConsultationAchatDevisRepository devisRepository,
            ConsultationAchatDestinataireRepository destinataireRepository,
            ConsultationAchatEnvoiRepository envoiRepository,
            PartnerRepository partnerRepository,
            PartnerRoleRepository roleRepository,
            PartnerContactRepository contactRepository,
            ObjectProvider<ConsultationLienEtudePort> lienEtudePort,
            ObjectProvider<EmailService> emailService,
            ObjectProvider<CatalogLookupApi> catalogLookup) {
        this.repository = repository;
        this.devisRepository = devisRepository;
        this.destinataireRepository = destinataireRepository;
        this.envoiRepository = envoiRepository;
        this.partnerRepository = partnerRepository;
        this.roleRepository = roleRepository;
        this.contactRepository = contactRepository;
        this.lienEtudePort = lienEtudePort;
        this.emailService = emailService;
        this.catalogLookup = catalogLookup;
    }

    @Transactional(readOnly = true)
    public List<ConsultationAchatDto> list(String lien) {
        return list(lien, null, null, null, null);
    }

    @Transactional(readOnly = true)
    public List<ConsultationAchatDto> list(
            String lien, String statut, UUID fournisseurId, UUID articleId, String search) {
        UUID tenantId = tenantId();
        List<ConsultationAchat> rows = loadRows(tenantId, lien);
        Map<UUID, List<ConsultationAchatDestinataire>> dests = loadDestinataires(rows);
        Map<UUID, List<ConsultationAchatEnvoi>> envois = loadEnvois(rows);
        String articleCle = resolveArticleCle(articleId);
        String statutNorm = StringUtils.hasText(statut) ? statut.trim().toUpperCase(Locale.ROOT) : null;
        String searchNorm = StringUtils.hasText(search) ? search.trim().toLowerCase(Locale.ROOT) : null;

        List<ConsultationAchatDto> out = new ArrayList<>();
        for (ConsultationAchat entity : rows) {
            List<ConsultationAchatDestinataire> d = dests.getOrDefault(entity.getId(), List.of());
            if (statutNorm != null
                    && !statutNorm.equalsIgnoreCase(
                            entity.getStatut() != null ? entity.getStatut() : "")) {
                continue;
            }
            if (fournisseurId != null
                    && d.stream().noneMatch(x -> fournisseurId.equals(x.getFournisseurId()))) {
                continue;
            }
            if (articleCle != null && !panierContains(entity, articleCle)) {
                continue;
            }
            ConsultationAchatDto dto = toDto(
                    entity,
                    countDevisRecus(d),
                    List.of(),
                    d,
                    envois.getOrDefault(entity.getId(), List.of()));
            if (searchNorm != null && !matchesSearch(dto, searchNorm)) {
                continue;
            }
            out.add(dto);
        }
        return out;
    }

    @Transactional(readOnly = true)
    public ConsultationAchatDto getById(UUID id) {
        return toDto(require(id), true);
    }

    @Transactional
    public ConsultationAchatDto create(ConsultationAchatCreateDto request) {
        UUID tenantId = tenantId();
        Set<String> panier = normalizePanier(request != null ? request.getClesStables() : null);
        if (panier.isEmpty()) {
            throw new IllegalArgumentException("consultation.panier.vide");
        }
        // AC-3 : fournisseurId encore posté (overlay 139) → ignoré, aucun destinataire.

        ConsultationAchat entity = ConsultationAchat.builder()
                .tenantId(tenantId)
                .numero(nextNumero(tenantId))
                .dossierEtudeId(request != null ? request.getDossierEtudeId() : null)
                .statut(ConsultationAchat.STATUT_PREPARATION)
                .clesStables(panier)
                .build();
        return toDto(repository.save(entity), false);
    }

    @Transactional
    public ConsultationAchatDto addDestinataire(UUID consultationId, ConsultationDestinataireCreateDto request) {
        ConsultationAchat consultation = require(consultationId);
        UUID tenantId = tenantId();
        if (request == null || request.getFournisseurId() == null) {
            throw new IllegalArgumentException("consultation.fournisseur.obligatoire");
        }
        Partner fournisseur = partnerRepository
                .findByIdAndTenantId(request.getFournisseurId(), tenantId)
                .orElseThrow(() -> new IllegalArgumentException("consultation.fournisseur.introuvable"));
        if (!roleRepository.existsByTenantIdAndPartnerIdAndRole(
                tenantId, fournisseur.getId(), PartnerRoleType.FOURNISSEUR)) {
            throw new IllegalArgumentException("consultation.fournisseur.pas_fiche");
        }
        if (destinataireRepository.existsByConsultationIdAndFournisseurId(
                consultation.getId(), fournisseur.getId())) {
            throw new IllegalArgumentException("consultation.destinataire.doublon");
        }

        List<PartnerContact> emailContacts = emailContactsOf(fournisseur.getId(), tenantId);
        PartnerContact bound = bindContact(emailContacts, request.getContactId());

        ConsultationAchatDestinataire row = ConsultationAchatDestinataire.builder()
                .tenantId(tenantId)
                .consultationId(consultation.getId())
                .fournisseurId(fournisseur.getId())
                .contactId(bound.getId())
                .statut(ConsultationAchatDestinataire.STATUT_EN_ATTENTE)
                .build();
        destinataireRepository.save(row);
        recomputeAndPersistStatut(consultation);
        return toDto(consultation, true);
    }

    @Transactional
    public ConsultationAchatDto envoyer(UUID consultationId) {
        ConsultationAchat consultation = require(consultationId);
        List<ConsultationAchatDestinataire> dests =
                destinataireRepository.findByConsultationIdOrderByCreatedAtAsc(consultation.getId());
        if (dests == null || dests.isEmpty()) {
            throw new IllegalArgumentException("consultation.envoyer.sans_destinataire");
        }
        Set<UUID> already = new HashSet<>();
        List<ConsultationAchatEnvoi> existing =
                envoiRepository.findByConsultationIdOrderBySentAtAsc(consultation.getId());
        if (existing != null) {
            for (ConsultationAchatEnvoi row : existing) {
                already.add(row.getDestinataireId());
            }
        }
        List<ConsultationAchatDestinataire> pending = new ArrayList<>();
        for (ConsultationAchatDestinataire dest : dests) {
            if (dest.getId() != null && !already.contains(dest.getId())) {
                pending.add(dest);
            }
        }
        if (pending.isEmpty()) {
            return toDto(consultation, true);
        }

        String subject = "Consultation " + consultation.getNumero();
        String text = buildPanierMailText(consultation);
        String html = buildPanierMailHtml(consultation);
        EmailService mail = emailService.getIfAvailable();
        OffsetDateTime now = OffsetDateTime.now();
        for (ConsultationAchatDestinataire dest : pending) {
            String email = contactEmail(dest.getContactId());
            if (!StringUtils.hasText(email)) {
                throw new IllegalArgumentException("consultation.destinataire.sans_email");
            }
            if (mail != null) {
                try {
                    mail.sendEmail(email, subject, html, text);
                } catch (RuntimeException ex) {
                    log.warn(
                            "consultation envoi mail dest={} : {}",
                            dest.getId(),
                            ex.getMessage());
                }
            }
            envoiRepository.save(ConsultationAchatEnvoi.builder()
                    .tenantId(consultation.getTenantId())
                    .consultationId(consultation.getId())
                    .destinataireId(dest.getId())
                    .email(email.trim())
                    .sentAt(now)
                    .build());
        }
        recomputeAndPersistStatut(consultation);
        return toDto(consultation, true);
    }

    @Transactional
    public ConsultationAchatDto addToPanier(UUID id, ConsultationAchatPanierDto request) {
        ConsultationAchat entity = require(id);
        if (entity.getId() != null && envoiRepository.existsByConsultationId(entity.getId())) {
            throw new IllegalArgumentException("consultation.panier.fige");
        }
        Set<String> merged = new LinkedHashSet<>();
        if (entity.getClesStables() != null) {
            merged.addAll(entity.getClesStables());
        }
        merged.addAll(normalizePanier(request != null ? request.getClesStables() : null));
        entity.setClesStables(merged);
        if (entity.getDossierEtudeId() == null
                && request != null
                && request.getDossierEtudeId() != null) {
            entity.setDossierEtudeId(request.getDossierEtudeId());
        }
        ConsultationAchatDto dto = toDto(repository.save(entity), false);
        notifierLienEtude(entity.getDossierEtudeId());
        return dto;
    }

    @Transactional
    public ConsultationAchatDto importDevis(UUID consultationId, ConsultationDevisImportDto request) {
        ConsultationAchat consultation = require(consultationId);
        UUID destinataireId = request != null ? request.getDestinataireId() : null;
        if (destinataireId == null) {
            throw new IllegalArgumentException("consultation.devis.destinataire.obligatoire");
        }
        ConsultationAchatDestinataire dest = destinataireRepository
                .findByIdAndTenantId(destinataireId, tenantId())
                .orElseThrow(() -> new IllegalArgumentException("consultation.devis.destinataire.invalide"));
        if (!consultation.getId().equals(dest.getConsultationId())) {
            throw new IllegalArgumentException("consultation.devis.destinataire.invalide");
        }

        List<ConsultationAchatDevisLigne> lignes = normalizeLignes(request.getLignes());
        if (lignes.isEmpty()) {
            throw new IllegalArgumentException("consultation.devis.lignes.vides");
        }

        devisRepository.findByDestinataireId(destinataireId).ifPresent(existing -> {
            devisRepository.delete(existing);
            devisRepository.flush();
        });

        ConsultationAchatDevis devis = ConsultationAchatDevis.builder()
                .tenantId(consultation.getTenantId())
                .consultationId(consultation.getId())
                .destinataireId(destinataireId)
                .fichierNom(StringUtils.hasText(request.getFichierNom())
                        ? request.getFichierNom().trim()
                        : null)
                .lignes(lignes)
                .build();
        devisRepository.save(devis);

        dest.setStatut(ConsultationAchatDestinataire.STATUT_DEVIS_RECU);
        destinataireRepository.save(dest);
        recomputeAndPersistStatut(consultation);
        notifierLienEtude(consultation.getDossierEtudeId());
        return toDto(consultation, true);
    }

    @Transactional(readOnly = true)
    public long countDevisExtraitsLies(UUID dossierEtudeId) {
        if (dossierEtudeId == null) {
            return 0L;
        }
        List<ConsultationAchat> liees =
                repository.findByTenantIdAndDossierEtudeId(tenantId(), dossierEtudeId);
        List<UUID> ids = liees.stream().map(ConsultationAchat::getId).filter(id -> id != null).toList();
        if (ids.isEmpty()) {
            return 0L;
        }
        return devisRepository.countByConsultationIdIn(ids);
    }

    private List<PartnerContact> emailContactsOf(UUID partenaireId, UUID tenantId) {
        List<PartnerContact> rows =
                contactRepository.findByTenantIdAndPartnerIdOrderByNomAsc(tenantId, partenaireId);
        List<PartnerContact> withEmail = new ArrayList<>();
        for (PartnerContact contact : rows) {
            if (contact != null && StringUtils.hasText(contact.getEmail())) {
                withEmail.add(contact);
            }
        }
        return withEmail;
    }

    private PartnerContact bindContact(List<PartnerContact> emailContacts, UUID requestedContactId) {
        if (emailContacts.isEmpty()) {
            throw new IllegalArgumentException("consultation.destinataire.sans_email");
        }
        if (emailContacts.size() == 1) {
            return emailContacts.get(0);
        }
        if (requestedContactId == null) {
            throw new IllegalArgumentException("consultation.destinataire.contact_requis");
        }
        return emailContacts.stream()
                .filter(c -> requestedContactId.equals(c.getId()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("consultation.destinataire.contact_invalide"));
    }

    private void notifierLienEtude(UUID dossierEtudeId) {
        if (dossierEtudeId == null) {
            return;
        }
        ConsultationLienEtudePort port = lienEtudePort.getIfAvailable();
        if (port != null) {
            port.appliquerFlagsApresDevis(dossierEtudeId);
        }
    }

    private ConsultationAchat require(UUID id) {
        return repository
                .findByIdAndTenantId(id, tenantId())
                .orElseThrow(() -> new IllegalArgumentException("consultation.introuvable"));
    }

    private List<ConsultationAchatDevisLigne> normalizeLignes(List<ConsultationDevisImportDto.Ligne> input) {
        List<ConsultationAchatDevisLigne> lignes = new ArrayList<>();
        if (input == null) {
            return lignes;
        }
        int ordre = 0;
        for (ConsultationDevisImportDto.Ligne raw : input) {
            if (raw == null) {
                continue;
            }
            String identite = trimToNull(raw.getIdentite());
            String libelle = trimToNull(raw.getLibelle());
            if (libelle == null && identite == null) {
                continue;
            }
            if (libelle == null) {
                libelle = identite;
            }
            lignes.add(ConsultationAchatDevisLigne.builder()
                    .identite(identite)
                    .libelle(libelle)
                    .quantite(finiteOrNull(raw.getQuantite()))
                    .unite(trimToNull(raw.getUnite()))
                    .prixUnitaire(finiteOrNull(raw.getPrixUnitaire()))
                    .ordre(ordre++)
                    .build());
        }
        return lignes;
    }

    private static String trimToNull(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }

    private static BigDecimal finiteOrNull(BigDecimal value) {
        if (value == null) {
            return null;
        }
        return value;
    }

    private List<ConsultationAchat> loadRows(UUID tenantId, String lien) {
        if (!StringUtils.hasText(lien) || "all".equalsIgnoreCase(lien.trim())) {
            return repository.findByTenantIdOrderByCreatedAtDesc(tenantId);
        }
        String normalized = lien.trim().toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "hors", "hors-etude" ->
                repository.findByTenantIdAndDossierEtudeIdIsNullOrderByCreatedAtDesc(tenantId);
            case "liee", "liée" ->
                repository.findByTenantIdAndDossierEtudeIdIsNotNullOrderByCreatedAtDesc(tenantId);
            default -> repository.findByTenantIdOrderByCreatedAtDesc(tenantId);
        };
    }

    private Map<UUID, List<ConsultationAchatDestinataire>> loadDestinataires(List<ConsultationAchat> rows) {
        Map<UUID, List<ConsultationAchatDestinataire>> map = new HashMap<>();
        List<UUID> ids = rows.stream().map(ConsultationAchat::getId).filter(id -> id != null).toList();
        if (ids.isEmpty()) {
            return map;
        }
        for (ConsultationAchatDestinataire row :
                destinataireRepository.findByConsultationIdInOrderByCreatedAtAsc(ids)) {
            map.computeIfAbsent(row.getConsultationId(), k -> new ArrayList<>()).add(row);
        }
        return map;
    }

    private Map<UUID, List<ConsultationAchatEnvoi>> loadEnvois(List<ConsultationAchat> rows) {
        Map<UUID, List<ConsultationAchatEnvoi>> map = new HashMap<>();
        List<UUID> ids = rows.stream().map(ConsultationAchat::getId).filter(id -> id != null).toList();
        if (ids.isEmpty()) {
            return map;
        }
        List<ConsultationAchatEnvoi> found = envoiRepository.findByConsultationIdInOrderBySentAtAsc(ids);
        if (found == null) {
            return map;
        }
        for (ConsultationAchatEnvoi row : found) {
            map.computeIfAbsent(row.getConsultationId(), k -> new ArrayList<>()).add(row);
        }
        return map;
    }

    private Set<String> normalizePanier(List<String> input) {
        Set<String> cles = new LinkedHashSet<>();
        if (input == null) {
            return cles;
        }
        for (String raw : input) {
            if (!StringUtils.hasText(raw)) {
                continue;
            }
            cles.add(raw.trim());
        }
        return cles;
    }

    private String nextNumero(UUID tenantId) {
        long count = repository.countByTenantId(tenantId) + 1;
        return "CS-" + Year.now().getValue() + "-" + String.format("%04d", count);
    }

    private void recomputeAndPersistStatut(ConsultationAchat consultation) {
        if (consultation.getId() == null) {
            return;
        }
        String next = derivedStatut(consultation.getId());
        if (!next.equals(consultation.getStatut())) {
            consultation.setStatut(next);
            repository.save(consultation);
        }
    }

    private String derivedStatut(UUID consultationId) {
        List<ConsultationAchatDestinataire> dests =
                nullToEmpty(destinataireRepository.findByConsultationIdOrderByCreatedAtAsc(consultationId));
        if (dests.isEmpty()) {
            return ConsultationAchat.STATUT_PREPARATION;
        }
        int recus = countDevisRecus(dests);
        int attente = dests.size() - recus;
        if (recus > 0 && attente == 0) {
            return ConsultationAchat.STATUT_COMPLETE;
        }
        if (recus > 0) {
            return ConsultationAchat.STATUT_PARTIELLE;
        }
        List<ConsultationAchatEnvoi> envois =
                nullToEmpty(envoiRepository.findByConsultationIdOrderBySentAtAsc(consultationId));
        if (!envois.isEmpty()) {
            return ConsultationAchat.STATUT_OUVERTE;
        }
        return ConsultationAchat.STATUT_PREPARATION;
    }

    private static int countDevisRecus(List<ConsultationAchatDestinataire> dests) {
        if (dests == null || dests.isEmpty()) {
            return 0;
        }
        int n = 0;
        for (ConsultationAchatDestinataire dest : dests) {
            if (ConsultationAchatDestinataire.STATUT_DEVIS_RECU.equals(dest.getStatut())) {
                n++;
            }
        }
        return n;
    }

    private ConsultationAchatDto toDto(ConsultationAchat entity, boolean includeDevis) {
        List<ConsultationDevisDto> devis = List.of();
        if (includeDevis && entity.getId() != null) {
            devis = devisRepository.findByConsultationIdOrderByCreatedAtAsc(entity.getId()).stream()
                    .map(this::toDevisDto)
                    .toList();
        }
        List<ConsultationAchatDestinataire> dests = entity.getId() != null
                ? nullToEmpty(destinataireRepository.findByConsultationIdOrderByCreatedAtAsc(entity.getId()))
                : List.of();
        List<ConsultationAchatEnvoi> envois = entity.getId() != null
                ? nullToEmpty(envoiRepository.findByConsultationIdOrderBySentAtAsc(entity.getId()))
                : List.of();
        return toDto(entity, countDevisRecus(dests), devis, dests, envois);
    }

    private ConsultationAchatDto toDto(
            ConsultationAchat entity,
            int devisRecus,
            List<ConsultationDevisDto> devis,
            List<ConsultationAchatDestinataire> dests,
            List<ConsultationAchatEnvoi> envois) {
        List<String> panier = new ArrayList<>();
        if (entity.getClesStables() != null) {
            panier.addAll(entity.getClesStables());
            panier.sort(String.CASE_INSENSITIVE_ORDER);
        }
        return ConsultationAchatDto.builder()
                .id(entity.getId())
                .numero(entity.getNumero())
                .clesStables(panier)
                .dossierEtudeId(entity.getDossierEtudeId())
                .statut(entity.getStatut())
                .devisRecus(devisRecus)
                .devis(devis)
                .destinataires(toDestinataireDtos(dests))
                .envois(toEnvoiDtos(envois, dests))
                .createdAt(entity.getCreatedAt())
                .build();
    }

    private List<ConsultationEnvoiDto> toEnvoiDtos(
            List<ConsultationAchatEnvoi> envois, List<ConsultationAchatDestinataire> dests) {
        if (envois == null || envois.isEmpty()) {
            return List.of();
        }
        Map<UUID, UUID> destToFournisseur = new HashMap<>();
        if (dests != null) {
            for (ConsultationAchatDestinataire dest : dests) {
                destToFournisseur.put(dest.getId(), dest.getFournisseurId());
            }
        }
        UUID tenantId = tenantId();
        Map<UUID, String> noms = new HashMap<>();
        List<ConsultationEnvoiDto> out = new ArrayList<>();
        for (ConsultationAchatEnvoi row : envois) {
            UUID fournisseurId = destToFournisseur.get(row.getDestinataireId());
            if (fournisseurId == null) {
                destinataireRepository
                        .findById(row.getDestinataireId())
                        .ifPresent(d -> destToFournisseur.put(d.getId(), d.getFournisseurId()));
                fournisseurId = destToFournisseur.get(row.getDestinataireId());
            }
            String nom = "";
            if (fournisseurId != null) {
                nom = noms.computeIfAbsent(
                        fournisseurId,
                        id -> partnerRepository
                                .findByIdAndTenantId(id, tenantId)
                                .map(Partner::getRaisonSociale)
                                .orElse(""));
            }
            out.add(ConsultationEnvoiDto.builder()
                    .id(row.getId())
                    .destinataireId(row.getDestinataireId())
                    .destinataireNom(nom)
                    .email(row.getEmail())
                    .sentAt(row.getSentAt())
                    .build());
        }
        return out;
    }

    private String contactEmail(UUID contactId) {
        if (contactId == null) {
            return "";
        }
        return contactRepository
                .findByIdAndTenantId(contactId, tenantId())
                .map(c -> c.getEmail() != null ? c.getEmail().trim() : "")
                .orElse("");
    }

    private String buildPanierMailText(ConsultationAchat consultation) {
        StringBuilder sb = new StringBuilder();
        sb.append("Consultation ").append(consultation.getNumero()).append("\n\n");
        sb.append("Panier :\n");
        for (String[] line : panierLines(consultation)) {
            sb.append("- ").append(line[0]).append(" / ").append(line[1]).append('\n');
        }
        return sb.toString();
    }

    private String buildPanierMailHtml(ConsultationAchat consultation) {
        StringBuilder sb = new StringBuilder();
        sb.append("<p>Consultation <strong>")
                .append(escapeHtml(consultation.getNumero()))
                .append("</strong></p>");
        sb.append("<p>Panier :</p><ul>");
        for (String[] line : panierLines(consultation)) {
            sb.append("<li>")
                    .append(escapeHtml(line[0]))
                    .append(" / ")
                    .append(escapeHtml(line[1]))
                    .append("</li>");
        }
        sb.append("</ul>");
        return sb.toString();
    }

    private List<String[]> panierLines(ConsultationAchat consultation) {
        List<String> cles = new ArrayList<>();
        if (consultation.getClesStables() != null) {
            cles.addAll(consultation.getClesStables());
            cles.sort(String.CASE_INSENSITIVE_ORDER);
        }
        CatalogLookupApi lookup = catalogLookup.getIfAvailable();
        List<String[]> lines = new ArrayList<>();
        for (String cle : cles) {
            String code = cle;
            String designation = cle;
            if (lookup != null) {
                try {
                    CatalogItemSnapshot item = lookup.findByCleStable(cle).orElse(null);
                    if (item != null) {
                        if (StringUtils.hasText(item.code())) {
                            code = item.code();
                        }
                        if (StringUtils.hasText(item.name())) {
                            designation = item.name();
                        }
                    }
                } catch (RuntimeException ignored) {
                    // AC-8 : cle_stable suffit.
                }
            }
            lines.add(new String[] {code, designation});
        }
        return lines;
    }

    private static String escapeHtml(String value) {
        if (value == null) {
            return "";
        }
        return value.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }

    private static <T> List<T> nullToEmpty(List<T> rows) {
        return rows != null ? rows : List.of();
    }

    private List<ConsultationDestinataireDto> toDestinataireDtos(List<ConsultationAchatDestinataire> rows) {
        if (rows == null || rows.isEmpty()) {
            return List.of();
        }
        UUID tenantId = tenantId();
        Map<UUID, String> noms = new HashMap<>();
        Map<UUID, String> emails = new HashMap<>();
        List<ConsultationDestinataireDto> out = new ArrayList<>();
        for (ConsultationAchatDestinataire row : rows) {
            String nom = noms.computeIfAbsent(
                    row.getFournisseurId(),
                    id -> partnerRepository
                            .findByIdAndTenantId(id, tenantId)
                            .map(Partner::getRaisonSociale)
                            .orElse(""));
            String email = emails.computeIfAbsent(
                    row.getContactId(),
                    id -> contactRepository
                            .findByIdAndTenantId(id, tenantId)
                            .map(c -> c.getEmail() != null ? c.getEmail() : "")
                            .orElse(""));
            out.add(ConsultationDestinataireDto.builder()
                    .id(row.getId())
                    .fournisseurId(row.getFournisseurId())
                    .fournisseurNom(nom)
                    .contactId(row.getContactId())
                    .contactEmail(email)
                    .statut(row.getStatut())
                    .build());
        }
        return out;
    }

    private ConsultationDevisDto toDevisDto(ConsultationAchatDevis entity) {
        List<ConsultationDevisLigneDto> lignes = new ArrayList<>();
        if (entity.getLignes() != null) {
            for (ConsultationAchatDevisLigne ligne : entity.getLignes()) {
                lignes.add(ConsultationDevisLigneDto.builder()
                        .id(ligne.getId())
                        .identite(ligne.getIdentite())
                        .libelle(ligne.getLibelle())
                        .quantite(ligne.getQuantite())
                        .unite(ligne.getUnite())
                        .prixUnitaire(ligne.getPrixUnitaire())
                        .build());
            }
        }
        return ConsultationDevisDto.builder()
                .id(entity.getId())
                .destinataireId(entity.getDestinataireId())
                .fichierNom(entity.getFichierNom())
                .createdAt(entity.getCreatedAt())
                .lignes(lignes)
                .build();
    }

    private boolean panierContains(ConsultationAchat entity, String articleCle) {
        if (entity.getClesStables() == null || !StringUtils.hasText(articleCle)) {
            return false;
        }
        for (String cle : entity.getClesStables()) {
            if (cle != null && cle.equalsIgnoreCase(articleCle)) {
                return true;
            }
        }
        return false;
    }

    private String resolveArticleCle(UUID articleId) {
        if (articleId == null) {
            return null;
        }
        CatalogLookupApi lookup = catalogLookup.getIfAvailable();
        if (lookup == null) {
            return articleId.toString();
        }
        return lookup.getItem(articleId)
                .map(CatalogItemSnapshot::cleStable)
                .filter(StringUtils::hasText)
                .orElse(articleId.toString());
    }

    private boolean matchesSearch(ConsultationAchatDto dto, String q) {
        if (dto.getNumero() != null && dto.getNumero().toLowerCase(Locale.ROOT).contains(q)) {
            return true;
        }
        if (dto.getClesStables() != null) {
            for (String cle : dto.getClesStables()) {
                if (cle != null && cle.toLowerCase(Locale.ROOT).contains(q)) {
                    return true;
                }
            }
        }
        if (dto.getDestinataires() != null) {
            for (ConsultationDestinataireDto dest : dto.getDestinataires()) {
                if (dest.getFournisseurNom() != null
                        && dest.getFournisseurNom().toLowerCase(Locale.ROOT).contains(q)) {
                    return true;
                }
            }
        }
        return false;
    }

    private UUID tenantId() {
        return TenantContext.getTenantId();
    }
}
