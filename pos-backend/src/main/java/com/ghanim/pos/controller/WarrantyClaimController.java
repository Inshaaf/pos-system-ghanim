package com.ghanim.pos.controller;

import com.ghanim.pos.dto.response.ApiResponse;
import com.ghanim.pos.entity.WarrantyClaim;
import com.ghanim.pos.service.WarrantyClaimService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/warranty")
@RequiredArgsConstructor
public class WarrantyClaimController {

    private final WarrantyClaimService service;

    @PostMapping
    public ResponseEntity<ApiResponse<WarrantyClaim>> create(@RequestBody Map<String, Object> req) {
        return ResponseEntity.ok(ApiResponse.ok(service.create(req), "Claim registered"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<WarrantyClaim>>> getAll(
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(ApiResponse.ok(service.getAll(status)));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<WarrantyClaim>> updateStatus(
            @PathVariable Long id, @RequestBody Map<String, String> req) {
        return ResponseEntity.ok(ApiResponse.ok(
                service.updateStatus(id, req.get("status"), req.get("resolutionType"), req.get("resolutionNotes")),
                "Status updated"));
    }

    @GetMapping("/product-stats")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getProductStats() {
        return ResponseEntity.ok(ApiResponse.ok(service.getProductStats()));
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSummary() {
        return ResponseEntity.ok(ApiResponse.ok(service.getSummary()));
    }
}
