package ma.nafura.chantiers.service;

import java.util.List;
import java.util.UUID;
import ma.nafura.chantiers.api.dto.JournalChantierDto;
import ma.nafura.chantiers.api.request.JournalChantierCreateDto;
import ma.nafura.chantiers.domain.model.JournalChantier;
import ma.nafura.chantiers.repository.JournalChantierRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class JournalChantierService {

    private final JournalChantierRepository repository;
    private final ChantierService chantierService;

    public JournalChantierService(
            JournalChantierRepository repository,
            ChantierService chantierService) {
        this.repository = repository;
        this.chantierService = chantierService;
    }

    @Transactional(readOnly = true)
    public List<JournalChantierDto> listByChantier(String chantierId) {
        chantierService.getById(chantierId);
        return repository
                .findByTenantIdAndChantierIdOrderByDateDescCreatedAtDesc(tenantId(), chantierId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public JournalChantierDto create(String chantierId, JournalChantierCreateDto body) {
        chantierService.getById(chantierId);
        JournalChantier entity = JournalChantier.builder()
                .id("jrn-" + UUID.randomUUID())
                .tenantId(tenantId())
                .chantierId(chantierId)
                .date(body.getDate())
                .auteur(body.getAuteur().trim())
                .contenu(body.getContenu().trim())
                .type(StringUtils.hasText(body.getType()) ? body.getType().trim() : "NOTE")
                .build();
        return toDto(repository.save(entity));
    }

    private JournalChantierDto toDto(JournalChantier row) {
        return JournalChantierDto.builder()
                .id(row.getId())
                .chantierId(row.getChantierId())
                .date(row.getDate())
                .auteur(row.getAuteur())
                .contenu(row.getContenu())
                .type(row.getType())
                .build();
    }

    private UUID tenantId() {
        return TenantContext.getTenantId();
    }
}
