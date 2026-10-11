package com.ghanim.pos.controller;

import com.ghanim.pos.dto.response.ApiResponse;
import com.ghanim.pos.service.SaleCancellationRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cancellation-requests")
@RequiredArgsConstructor
public class SaleCancellationRequestController {

    private final SaleCancellationRequestService requestService;

    @PostMapping
    @PreAuthorize("hasRole('CASHIER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> request(
            @RequestBody Map<String, String> body, Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.ok(requestService.request(
                body.get("saleType"), parseId(body.get("saleId")), body.get("reason"), authentication.getName())));
    }

    @GetMapping
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getPending() {
        return ResponseEntity.ok(ApiResponse.ok(requestService.getPending()));
    }

    @PatchMapping("/{id}/approve")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> approve(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.ok(requestService.review(id, true, authentication.getName())));
    }

    @PatchMapping("/{id}/reject")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> reject(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.ok(requestService.review(id, false, authentication.getName())));
    }

    private Long parseId(String value) {
        try {
            return Long.valueOf(value);
        } catch (RuntimeException ex) {
            throw new IllegalArgumentException("Sale ID is required");
        }
    }
}
