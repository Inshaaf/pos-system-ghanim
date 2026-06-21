package com.ghanim.pos.controller;

import com.ghanim.pos.dto.response.ApiResponse;
import com.ghanim.pos.entity.Session;
import com.ghanim.pos.service.SessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
public class SessionController {

    private final SessionService sessionService;

    @GetMapping("/current")
    public ResponseEntity<ApiResponse<Session>> getCurrent() {
        Optional<Session> session = sessionService.getCurrentSession();
        return ResponseEntity.ok(ApiResponse.ok(session.orElse(null)));
    }

    @PostMapping("/open")
    public ResponseEntity<ApiResponse<Session>> open(@RequestBody Map<String, Object> body) {
        String cashierName = (String) body.get("cashierName");
        BigDecimal openingFloat = new BigDecimal(body.getOrDefault("openingFloat", "0").toString());
        return ResponseEntity.ok(ApiResponse.ok(sessionService.openSession(cashierName, openingFloat), "Session opened"));
    }

    @PostMapping("/{id}/close")
    public ResponseEntity<ApiResponse<Map<String, Object>>> close(
            @PathVariable Long id, @RequestBody Map<String, Object> body) {
        BigDecimal closingCash = new BigDecimal(body.getOrDefault("closingCash", "0").toString());
        String notes = (String) body.get("notes");
        return ResponseEntity.ok(ApiResponse.ok(sessionService.closeSession(id, closingCash, notes), "Session closed"));
    }

    // Cashier submits their blind count — returns NO financial information
    @PostMapping("/{id}/submit-count")
    public ResponseEntity<ApiResponse<Void>> submitCount(
            @PathVariable Long id, @RequestBody Map<String, Object> body) {
        BigDecimal closingCash = new BigDecimal(body.getOrDefault("closingCash", "0").toString());
        String notes = (String) body.get("notes");
        sessionService.submitCount(id, closingCash, notes);
        return ResponseEntity.ok(ApiResponse.ok(null, "Your count has been submitted. Thank you."));
    }

    // Owner: list all sessions with full reconciliation
    @GetMapping
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok(sessionService.getAllWithReconciliation()));
    }

    // Owner: single session reconciliation
    @GetMapping("/{id}/reconciliation")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getReconciliation(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(sessionService.getReconciliation(id)));
    }
}
