package ma.nafura.platform.documents.docextractor.service;

import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.nafura.platform.documents.docextractor.domain.model.ExtractedRecord;
import ma.nafura.platform.documents.docextractor.repository.ExtractedRecordRepository;
import ma.nafura.platform.documents.docextractor.service.HashService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class DedupService {

    private final ExtractedRecordRepository repository;
    private final HashService hashService;

    @Value("${dedup.phashThreshold:10}")
    private int phashThreshold;

    @Value("${dedup.maxCandidates:2000}")
    private int maxCandidates;

    @Data
    @Builder
    public static class DedupResult {
        private ExactMatch exactMatch;
        private NearMatch nearMatch;

        @Data
        @Builder
        public static class ExactMatch {
            private boolean duplicate;
            private String existingRecordId;
        }

        @Data
        @Builder
        public static class NearMatch {
            private boolean duplicate;
            private String candidateRecordId;
            private int distance;
        }
    }

    /**
     * Check for exact duplicates using SHA-256.
     */
    @Transactional(readOnly = true)
    public Optional<ExtractedRecord> findExactDuplicate(UUID tenantId, String sha256) {
        return repository.findByTenantIdAndSha256(tenantId, sha256);
    }

    /**
     * Check for near duplicates using pHash Hamming distance.
     */
    @Transactional(readOnly = true)
    public DedupResult.NearMatch findNearDuplicate(UUID tenantId, Long phash, String excludeRecordId) {
        if (phash == null) {
            return DedupResult.NearMatch.builder().duplicate(false).build();
        }

        // Fetch recent records with phash
        List<ExtractedRecord> candidates = repository.findRecentWithPhash(
                tenantId, PageRequest.of(0, maxCandidates));

        int minDistance = Integer.MAX_VALUE;
        String bestCandidateId = null;

        for (ExtractedRecord candidate : candidates) {
            if (candidate.getPhash() == null) continue;
            if (excludeRecordId != null && excludeRecordId.equals(candidate.getRecordId())) continue;
            
            int distance = hashService.hammingDistance(phash, candidate.getPhash());
            if (distance < minDistance) {
                minDistance = distance;
                bestCandidateId = candidate.getRecordId();
            }
        }

        boolean isNearDuplicate = bestCandidateId != null && minDistance <= phashThreshold;

        return DedupResult.NearMatch.builder()
                .duplicate(isNearDuplicate)
                .candidateRecordId(bestCandidateId)
                .distance(isNearDuplicate ? minDistance : 0)
                .build();
    }
}

