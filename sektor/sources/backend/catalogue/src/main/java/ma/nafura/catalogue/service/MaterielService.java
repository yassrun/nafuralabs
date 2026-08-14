package ma.nafura.catalogue.service;

import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import ma.nafura.catalogue.api.request.ItemCreateDto;
import ma.nafura.catalogue.api.request.MaterielCreateDto;
import ma.nafura.catalogue.api.request.MaterielUpdateDto;
import ma.nafura.catalogue.domain.Nature;
import ma.nafura.catalogue.domain.model.Item;
import ma.nafura.catalogue.domain.model.Materiel;
import ma.nafura.catalogue.repository.MaterielRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class MaterielService {

    private final MaterielRepository repository;
    private final ItemService itemService;

    public MaterielService(MaterielRepository repository, ItemService itemService) {
        this.repository = repository;
        this.itemService = itemService;
    }

    @Transactional(readOnly = true)
    public Page<Materiel> list(
            int page, int size, String search, String status, UUID itemCategoryId, String sort) {
        UUID tenantId = tenantId();
        Specification<Materiel> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("tenantId"), tenantId));
            if (StringUtils.hasText(status)) {
                predicates.add(cb.equal(cb.upper(root.get("status")), status.trim().toUpperCase()));
            }
            if (itemCategoryId != null) {
                predicates.add(cb.equal(root.get("itemCategoryId"), itemCategoryId));
            }
            if (StringUtils.hasText(search)) {
                String term = "%" + search.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("code")), term),
                        cb.like(cb.lower(root.get("name")), term),
                        cb.like(cb.lower(root.get("numeroSerie")), term),
                        cb.like(cb.lower(root.get("marque")), term),
                        cb.like(cb.lower(root.get("modele")), term)));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
        Pageable pageable = PageRequest.of(page, size, parseSort(sort));
        return repository.findAll(spec, pageable);
    }

    @Transactional(readOnly = true)
    public Materiel getById(UUID id) {
        return repository
                .findByIdAndTenantId(id, tenantId())
                .orElseThrow(() -> new IllegalArgumentException("Materiel not found"));
    }

    @Transactional
    public Materiel create(MaterielCreateDto request) {
        UUID tenantId = tenantId();
        String code = request.getCode().trim();
        if (repository.existsByTenantIdAndCode(tenantId, code)) {
            throw new IllegalArgumentException("Materiel code already exists");
        }

        Item linkedItem = resolveOrCreateLinkedItem(request, code);

        Materiel entity = Materiel.builder()
                .tenantId(tenantId)
                .code(code)
                .name(request.getName().trim())
                .description(request.getDescription())
                .itemId(linkedItem.getId())
                .itemCategoryId(
                        request.getItemCategoryId() != null
                                ? request.getItemCategoryId()
                                : linkedItem.getItemCategoryId())
                .marque(request.getMarque())
                .modele(request.getModele())
                .numeroSerie(request.getNumeroSerie().trim())
                .anneeMiseEnService(request.getAnneeMiseEnService())
                .puissanceCapacite(request.getPuissanceCapacite())
                .status(request.getStatus() != null ? request.getStatus().trim() : "DISPONIBLE")
                .dateDernierEntretien(request.getDateDernierEntretien())
                .prochaineMaintenance(request.getProchaineMaintenance())
                .notesMaintenance(request.getNotesMaintenance())
                .chantierActuelId(request.getChantierActuelId())
                .chantierActuelName(request.getChantierActuelName())
                .isActive(request.getIsActive())
                .build();
        return repository.save(entity);
    }

    @Transactional
    public Materiel update(UUID id, MaterielUpdateDto request) {
        Materiel entity = getById(id);
        if (request.getCode() != null) {
            entity.setCode(request.getCode().trim());
        }
        if (request.getName() != null) {
            entity.setName(request.getName().trim());
        }
        if (request.getDescription() != null) {
            entity.setDescription(request.getDescription());
        }
        if (request.getItemId() != null) {
            entity.setItemId(requireMaterielItem(request.getItemId()).getId());
        }
        if (request.getItemCategoryId() != null) {
            entity.setItemCategoryId(request.getItemCategoryId());
        }
        if (request.getMarque() != null) {
            entity.setMarque(request.getMarque());
        }
        if (request.getModele() != null) {
            entity.setModele(request.getModele());
        }
        if (request.getNumeroSerie() != null) {
            entity.setNumeroSerie(request.getNumeroSerie().trim());
        }
        if (request.getAnneeMiseEnService() != null) {
            entity.setAnneeMiseEnService(request.getAnneeMiseEnService());
        }
        if (request.getPuissanceCapacite() != null) {
            entity.setPuissanceCapacite(request.getPuissanceCapacite());
        }
        if (request.getStatus() != null) {
            entity.setStatus(request.getStatus().trim());
        }
        if (request.getDateDernierEntretien() != null) {
            entity.setDateDernierEntretien(request.getDateDernierEntretien());
        }
        if (request.getProchaineMaintenance() != null) {
            entity.setProchaineMaintenance(request.getProchaineMaintenance());
        }
        if (request.getNotesMaintenance() != null) {
            entity.setNotesMaintenance(request.getNotesMaintenance());
        }
        if (request.getChantierActuelId() != null) {
            entity.setChantierActuelId(request.getChantierActuelId());
        }
        if (request.getChantierActuelName() != null) {
            entity.setChantierActuelName(request.getChantierActuelName());
        }
        if (request.getIsActive() != null) {
            entity.setIsActive(request.getIsActive());
        }
        return repository.save(entity);
    }

    @Transactional
    public void delete(UUID id) {
        Materiel entity = getById(id);
        repository.delete(entity);
    }

    private Item resolveOrCreateLinkedItem(MaterielCreateDto request, String code) {
        if (request.getItemId() != null) {
            return requireMaterielItem(request.getItemId());
        }
        ItemCreateDto itemDto = new ItemCreateDto();
        itemDto.setCode(code);
        itemDto.setName(request.getName().trim());
        itemDto.setDescription(request.getDescription());
        itemDto.setItemCategoryId(request.getItemCategoryId());
        itemDto.setNature(Nature.MATERIEL.name());
        itemDto.setIsActive(request.getIsActive() != null ? request.getIsActive() : Boolean.TRUE);
        return itemService.create(itemDto);
    }

    private Item requireMaterielItem(UUID itemId) {
        Item item = itemService
                .getById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("Linked item not found"));
        if (Nature.fromLegacy(item.getNature()) != Nature.MATERIEL) {
            throw new IllegalArgumentException("Linked item must have nature MATERIEL");
        }
        return item;
    }

    private static Sort parseSort(String sort) {
        if (!StringUtils.hasText(sort)) {
            return Sort.by(Sort.Direction.ASC, "code");
        }
        String[] parts = sort.split(",", 2);
        String field = parts[0].trim();
        Sort.Direction direction =
                parts.length > 1 && "desc".equalsIgnoreCase(parts[1].trim())
                        ? Sort.Direction.DESC
                        : Sort.Direction.ASC;
        return Sort.by(direction, field);
    }

    private static UUID tenantId() {
        return TenantContext.getTenantId();
    }
}
