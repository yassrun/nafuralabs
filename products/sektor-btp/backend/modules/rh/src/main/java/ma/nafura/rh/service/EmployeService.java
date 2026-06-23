package ma.nafura.rh.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.rh.api.request.EmployeCreateDto;
import ma.nafura.rh.api.request.EmployeUpdateDto;
import ma.nafura.rh.domain.model.Employe;
import ma.nafura.rh.repository.EmployeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class EmployeService {

    private static final Pattern MATRICULE_SUFFIX = Pattern.compile("^MAT-(\\d+)$", Pattern.CASE_INSENSITIVE);

    private final EmployeRepository repository;
    private final EmployeSeedService seedService;

    public EmployeService(EmployeRepository repository, EmployeSeedService seedService) {
        this.repository = repository;
        this.seedService = seedService;
    }

    @Transactional(readOnly = true)
    public List<Employe> list(String statut, String typeContrat, String categorie, String search) {
        seedService.seedIfEmpty();
        UUID tenantId = tenantId();
        List<Employe> rows = loadRows(tenantId, statut, typeContrat, categorie);
        if (StringUtils.hasText(search)) {
            String term = search.trim().toLowerCase(Locale.ROOT);
            rows = rows.stream().filter(e -> matchesSearch(e, term)).toList();
        }
        return rows;
    }

    @Transactional(readOnly = true)
    public Employe getById(String id) {
        seedService.seedIfEmpty();
        return resolve(id).orElseThrow(() -> new IllegalArgumentException("Employe not found"));
    }

    @Transactional
    public Employe create(EmployeCreateDto request) {
        UUID tenantId = tenantId();
        CnssValidation.validateCin(request.getCin());
        CnssValidation.validateCnss(request.getCnss());

        String id = StringUtils.hasText(request.getId()) ? request.getId().trim() : nextEmployeId(tenantId);
        if (repository.findByIdAndTenantId(id, tenantId).isPresent()) {
            throw new IllegalArgumentException("Employe id already exists: " + id);
        }

        Employe entity = Employe.builder()
                .id(id)
                .tenantId(tenantId)
                .matricule(nextMatricule(tenantId))
                .nom(request.getNom().trim())
                .prenom(request.getPrenom().trim())
                .cin(request.getCin().trim().toUpperCase(Locale.ROOT))
                .cnss(trimOrNull(request.getCnss()))
                .dateNaissance(request.getDateNaissance())
                .adresse(trimOrNull(request.getAdresse()))
                .ville(trimOrNull(request.getVille()))
                .telephone(trimOrNull(request.getTelephone()))
                .email(trimOrNull(request.getEmail()))
                .poste(request.getPoste().trim())
                .departement(trimOrNull(request.getDepartement()))
                .categorie(request.getCategorie().trim())
                .typeContrat(request.getTypeContrat().trim())
                .statut(resolveStatut(request.getStatut(), Employe.STATUT_ACTIF))
                .dateEmbauche(request.getDateEmbauche())
                .dateFinContrat(request.getDateFinContrat())
                .salaireBase(defaultAmount(request.getSalaireBase()))
                .indemniteRepresentation(request.getIndemniteRepresentation())
                .indemniteTransport(request.getIndemniteTransport())
                .rib(trimOrNull(request.getRib()))
                .banque(trimOrNull(request.getBanque()))
                .notes(trimOrNull(request.getNotes()))
                .ice(trimOrNull(request.getIce()))
                .ifFiscal(trimOrNull(request.getIfFiscal()))
                .rc(trimOrNull(request.getRc()))
                .patente(trimOrNull(request.getPatente()))
                .build();
        return repository.save(entity);
    }

    @Transactional
    public Employe update(String id, EmployeUpdateDto request) {
        Employe entity = getById(id);
        if (request.getNom() != null) {
            entity.setNom(request.getNom().trim());
        }
        if (request.getPrenom() != null) {
            entity.setPrenom(request.getPrenom().trim());
        }
        if (request.getCin() != null) {
            CnssValidation.validateCin(request.getCin());
            entity.setCin(request.getCin().trim().toUpperCase(Locale.ROOT));
        }
        if (request.getCnss() != null) {
            CnssValidation.validateCnss(request.getCnss());
            entity.setCnss(trimOrNull(request.getCnss()));
        }
        if (request.getDateNaissance() != null) {
            entity.setDateNaissance(request.getDateNaissance());
        }
        if (request.getAdresse() != null) {
            entity.setAdresse(trimOrNull(request.getAdresse()));
        }
        if (request.getVille() != null) {
            entity.setVille(trimOrNull(request.getVille()));
        }
        if (request.getTelephone() != null) {
            entity.setTelephone(trimOrNull(request.getTelephone()));
        }
        if (request.getEmail() != null) {
            entity.setEmail(trimOrNull(request.getEmail()));
        }
        if (request.getPoste() != null) {
            entity.setPoste(request.getPoste().trim());
        }
        if (request.getDepartement() != null) {
            entity.setDepartement(trimOrNull(request.getDepartement()));
        }
        if (request.getCategorie() != null) {
            entity.setCategorie(request.getCategorie().trim());
        }
        if (request.getTypeContrat() != null) {
            entity.setTypeContrat(request.getTypeContrat().trim());
        }
        if (request.getStatut() != null) {
            entity.setStatut(resolveStatut(request.getStatut(), entity.getStatut()));
        }
        if (request.getDateEmbauche() != null) {
            entity.setDateEmbauche(request.getDateEmbauche());
        }
        if (request.getDateFinContrat() != null) {
            entity.setDateFinContrat(request.getDateFinContrat());
        }
        if (request.getSalaireBase() != null) {
            entity.setSalaireBase(defaultAmount(request.getSalaireBase()));
        }
        if (request.getIndemniteRepresentation() != null) {
            entity.setIndemniteRepresentation(request.getIndemniteRepresentation());
        }
        if (request.getIndemniteTransport() != null) {
            entity.setIndemniteTransport(request.getIndemniteTransport());
        }
        if (request.getRib() != null) {
            entity.setRib(trimOrNull(request.getRib()));
        }
        if (request.getBanque() != null) {
            entity.setBanque(trimOrNull(request.getBanque()));
        }
        if (request.getNotes() != null) {
            entity.setNotes(trimOrNull(request.getNotes()));
        }
        if (request.getIce() != null) {
            entity.setIce(trimOrNull(request.getIce()));
        }
        if (request.getIfFiscal() != null) {
            entity.setIfFiscal(trimOrNull(request.getIfFiscal()));
        }
        if (request.getRc() != null) {
            entity.setRc(trimOrNull(request.getRc()));
        }
        if (request.getPatente() != null) {
            entity.setPatente(trimOrNull(request.getPatente()));
        }
        return repository.save(entity);
    }

    @Transactional
    public void delete(String id) {
        Employe entity = getById(id);
        repository.delete(entity);
    }

    private List<Employe> loadRows(UUID tenantId, String statut, String typeContrat, String categorie) {
        String normalizedStatut = normalizeFilter(statut);
        String normalizedType = normalizeFilter(typeContrat);
        String normalizedCategorie = normalizeFilter(categorie);

        if (normalizedStatut != null && normalizedType != null && normalizedCategorie != null) {
            return repository.findByTenantIdAndStatutAndTypeContratAndCategorieOrderByNomAscPrenomAsc(
                    tenantId, normalizedStatut, normalizedType, normalizedCategorie);
        }
        if (normalizedStatut != null && normalizedType != null) {
            return repository.findByTenantIdAndStatutAndTypeContratOrderByNomAscPrenomAsc(
                    tenantId, normalizedStatut, normalizedType);
        }
        if (normalizedStatut != null && normalizedCategorie != null) {
            return repository.findByTenantIdAndStatutAndCategorieOrderByNomAscPrenomAsc(
                    tenantId, normalizedStatut, normalizedCategorie);
        }
        if (normalizedType != null && normalizedCategorie != null) {
            return repository.findByTenantIdAndTypeContratAndCategorieOrderByNomAscPrenomAsc(
                    tenantId, normalizedType, normalizedCategorie);
        }
        if (normalizedStatut != null) {
            return repository.findByTenantIdAndStatutOrderByNomAscPrenomAsc(tenantId, normalizedStatut);
        }
        if (normalizedType != null) {
            return repository.findByTenantIdAndTypeContratOrderByNomAscPrenomAsc(tenantId, normalizedType);
        }
        if (normalizedCategorie != null) {
            return repository.findByTenantIdAndCategorieOrderByNomAscPrenomAsc(tenantId, normalizedCategorie);
        }
        return repository.findByTenantIdOrderByNomAscPrenomAsc(tenantId);
    }

    private boolean matchesSearch(Employe employe, String term) {
        return contains(employe.getMatricule(), term)
                || contains(employe.getNom(), term)
                || contains(employe.getPrenom(), term)
                || contains(employe.getPoste(), term)
                || contains(employe.getCin(), term)
                || contains(employe.getCnss(), term);
    }

    private boolean contains(String value, String term) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(term);
    }

    private Optional<Employe> resolve(String rawId) {
        String id = rawId != null ? rawId.trim() : "";
        if (!StringUtils.hasText(id)) {
            return Optional.empty();
        }
        UUID tenantId = tenantId();
        Optional<Employe> byId = repository.findByIdAndTenantId(id, tenantId);
        if (byId.isPresent()) {
            return byId;
        }
        return repository.findByTenantIdAndMatricule(tenantId, id);
    }

    private String nextEmployeId(UUID tenantId) {
        int max = 0;
        for (Employe employe : repository.findByTenantIdOrderByNomAscPrenomAsc(tenantId)) {
            Matcher matcher = Pattern.compile("^emp-(\\d+)$").matcher(employe.getId());
            if (matcher.matches()) {
                max = Math.max(max, Integer.parseInt(matcher.group(1)));
            }
        }
        return String.format(Locale.ROOT, "emp-%03d", max + 1);
    }

    private String nextMatricule(UUID tenantId) {
        int max = 0;
        for (Employe employe : repository.findByTenantIdOrderByNomAscPrenomAsc(tenantId)) {
            Matcher matcher = MATRICULE_SUFFIX.matcher(employe.getMatricule());
            if (matcher.matches()) {
                max = Math.max(max, Integer.parseInt(matcher.group(1)));
            }
        }
        return String.format(Locale.ROOT, "MAT-%03d", max + 1);
    }

    private String resolveStatut(String requested, String fallback) {
        if (!StringUtils.hasText(requested)) {
            return fallback;
        }
        String normalized = requested.trim().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case Employe.STATUT_ACTIF, Employe.STATUT_SUSPENDU, Employe.STATUT_SOLDE -> normalized;
            default -> fallback;
        };
    }

    private String normalizeFilter(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private BigDecimal defaultAmount(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    private String trimOrNull(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }

    private UUID tenantId() {
        return TenantContext.getTenantId();
    }
}
