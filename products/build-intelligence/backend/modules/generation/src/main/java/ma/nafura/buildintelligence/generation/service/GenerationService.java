package ma.nafura.buildintelligence.generation.service;

import lombok.RequiredArgsConstructor;
import ma.nafura.buildintelligence.catalog.domain.WorkItem;
import ma.nafura.buildintelligence.catalog.repository.WorkItemRepository;
import ma.nafura.buildintelligence.generation.domain.GenerationJob;
import ma.nafura.buildintelligence.generation.domain.GenerationJobStatus;
import ma.nafura.buildintelligence.generation.repository.GenerationJobRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.time.OffsetDateTime;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GenerationService {

    private final GenerationJobRepository generationJobRepository;
    private final WorkItemRepository workItemRepository;

    @Transactional
    public GenerationJob createBpuJob(List<UUID> workItemIds, String requestedBy) {
        GenerationJob job = new GenerationJob();
        job.setTenantId(TenantContext.getTenantId());
        job.setJobType("BPU");
        job.setStatus(GenerationJobStatus.PENDING_APPROVAL);
        job.setRequestedBy(requestedBy);
        job.setRequest(Map.of("workItemIds", workItemIds));
        job.setResult(buildPreview(workItemIds));
        return generationJobRepository.save(job);
    }

    @Transactional
    public GenerationJob createDqeJob(List<UUID> workItemIds, String requestedBy) {
        GenerationJob job = createBpuJob(workItemIds, requestedBy);
        job.setJobType("DQE");
        return generationJobRepository.save(job);
    }

    @Transactional(readOnly = true)
    public GenerationJob get(UUID id) {
        return generationJobRepository.findByIdAndTenantId(id, TenantContext.getTenantId())
                .orElseThrow(() -> new IllegalArgumentException("Generation job not found"));
    }

    @Transactional
    public GenerationJob approve(UUID id, String approvedBy) {
        GenerationJob job = get(id);
        job.setStatus(GenerationJobStatus.APPROVED);
        job.setApprovedBy(approvedBy);
        job.setApprovedAt(OffsetDateTime.now());
        return generationJobRepository.save(job);
    }

    @Transactional
    public Map<String, Object> export(UUID id) {
        GenerationJob job = get(id);
        if (job.getStatus() != GenerationJobStatus.APPROVED) {
            throw new IllegalStateException("Generation job must be approved before export");
        }
        @SuppressWarnings("unchecked")
        List<String> workItemIds = ((List<Object>) job.getRequest().get("workItemIds"))
                .stream().map(Object::toString).toList();
        List<UUID> ids = workItemIds.stream().map(UUID::fromString).toList();
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet(job.getJobType());
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Désignation");
            header.createCell(1).setCellValue("Unité");
            header.createCell(2).setCellValue("Quantité");
            header.createCell(3).setCellValue("Prix unitaire");
            header.createCell(4).setCellValue("Montant");

            int rowNum = 1;
            for (UUID workItemId : ids) {
                WorkItem item = workItemRepository.findByIdAndTenantId(workItemId, TenantContext.getTenantId())
                        .orElseThrow();
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(item.getDesignation());
                row.createCell(1).setCellValue(item.getUnitCode());
                row.createCell(2).setCellValue(1);
                row.createCell(3).setCellValue(0);
                row.createCell(4).setCellValue(0);
            }
            workbook.write(out);
            job.setStatus(GenerationJobStatus.COMPLETED);
            job.setFinishedAt(OffsetDateTime.now());
            generationJobRepository.save(job);
            return Map.of(
                    "filename", job.getJobType().toLowerCase() + "-" + id + ".xlsx",
                    "contentBase64", Base64.getEncoder().encodeToString(out.toByteArray()),
                    "provenance", job.getResult()
            );
        } catch (Exception ex) {
            job.setStatus(GenerationJobStatus.FAILED);
            generationJobRepository.save(job);
            throw new IllegalStateException("Failed to export generation job", ex);
        }
    }

    private Map<String, Object> buildPreview(List<UUID> workItemIds) {
        Map<String, Object> preview = new HashMap<>();
        preview.put("lineCount", workItemIds.size());
        preview.put("missingInformation", workItemIds.isEmpty() ? List.of("no_work_items") : List.of());
        preview.put("confidence", "MEDIUM");
        return preview;
    }
}
