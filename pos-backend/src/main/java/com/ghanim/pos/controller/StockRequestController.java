package com.ghanim.pos.controller;

import com.ghanim.pos.dto.response.ApiResponse;
import com.ghanim.pos.entity.StockRequest;
import com.ghanim.pos.service.StockRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/stock-requests")
@RequiredArgsConstructor
public class StockRequestController {

    private final StockRequestService stockRequestService;

    @PostMapping
    public ResponseEntity<ApiResponse<StockRequest>> create(
            @RequestBody StockRequest request,
            Authentication auth) {
        request.setRequestedBy(auth.getName());
        return ResponseEntity.ok(ApiResponse.ok(stockRequestService.create(request), "Request submitted"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<StockRequest>>> getPending(
            @RequestParam(defaultValue = "false") boolean all) {
        List<StockRequest> list = all ? stockRequestService.getAll() : stockRequestService.getPending();
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<StockRequest>> approve(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body,
            Authentication auth) {
        String note = body != null ? body.get("reviewNote") : null;
        return ResponseEntity.ok(ApiResponse.ok(
                stockRequestService.approve(id, auth.getName(), note), "Approved"));
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<StockRequest>> reject(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body,
            Authentication auth) {
        String note = body != null ? body.get("reviewNote") : null;
        return ResponseEntity.ok(ApiResponse.ok(
                stockRequestService.reject(id, auth.getName(), note), "Rejected"));
    }
}
