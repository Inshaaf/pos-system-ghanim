package com.ghanim.pos.service;

import com.ghanim.pos.entity.WarrantyClaim;
import com.ghanim.pos.exception.ResourceNotFoundException;
import com.ghanim.pos.repository.WarrantyClaimRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class WarrantyClaimService {

    private final WarrantyClaimRepository repo;

    @Transactional
    public WarrantyClaim create(Map<String, Object> req) {
        WarrantyClaim claim = WarrantyClaim.builder()
                .customerName((String) req.get("customerName"))
                .customerPhone((String) req.get("customerPhone"))
                .productName((String) req.get("productName"))
                .productId(req.get("productId") != null ? Long.valueOf(req.get("productId").toString()) : null)
                .originalSaleId(req.get("originalSaleId") != null ? Long.valueOf(req.get("originalSaleId").toString()) : null)
                .issueDescription((String) req.get("issueDescription"))
                .handledBy((String) req.get("handledBy"))
                .status("PENDING")
                .claimDate(LocalDateTime.now())
                .build();
        return repo.save(claim);
    }

    public List<WarrantyClaim> getAll(String status) {
        if (status != null && !status.isBlank()) {
            return repo.findByStatusOrderByCreatedAtDesc(status);
        }
        return repo.findAllByOrderByCreatedAtDesc();
    }

    @Transactional
    public WarrantyClaim updateStatus(Long id, String status, String resolutionType, String resolutionNotes) {
        WarrantyClaim claim = repo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Warranty claim not found: " + id));
        claim.setStatus(status);
        if (resolutionType != null) claim.setResolutionType(resolutionType);
        if (resolutionNotes != null) claim.setResolutionNotes(resolutionNotes);
        if (List.of("RESOLVED", "REPLACED", "REJECTED").contains(status)) {
            claim.setResolvedDate(LocalDateTime.now());
        }
        return repo.save(claim);
    }

    public List<Map<String, Object>> getProductStats() {
        List<Object[]> rows = repo.findProductClaimCounts();
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] row : rows) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("productName", row[0]);
            m.put("claimCount", ((Number) row[1]).longValue());
            result.add(m);
        }
        return result;
    }

    public Map<String, Object> getSummary() {
        List<WarrantyClaim> all = repo.findAllByOrderByCreatedAtDesc();
        long pending = all.stream().filter(c -> "PENDING".equals(c.getStatus())).count();
        long inRepair = all.stream().filter(c -> "IN_REPAIR".equals(c.getStatus())).count();
        long resolved = all.stream().filter(c -> List.of("RESOLVED", "REPLACED").contains(c.getStatus())).count();
        long rejected = all.stream().filter(c -> "REJECTED".equals(c.getStatus())).count();
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("total", all.size());
        m.put("pending", pending);
        m.put("inRepair", inRepair);
        m.put("resolved", resolved);
        m.put("rejected", rejected);
        return m;
    }
}
