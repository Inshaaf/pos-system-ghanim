package com.ghanim.pos.controller;

import com.ghanim.pos.dto.request.CheckoutRequest;
import com.ghanim.pos.dto.response.ApiResponse;
import com.ghanim.pos.service.SaleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sales")
@RequiredArgsConstructor
public class SaleController {

    private final SaleService saleService;

    @PostMapping("/checkout")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkout(@Valid @RequestBody CheckoutRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(saleService.checkout(request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getByDate(
            @RequestParam(required = false) String date) {
        LocalDate d = (date != null && !date.isBlank()) ? LocalDate.parse(date) : LocalDate.now();
        return ResponseEntity.ok(ApiResponse.ok(saleService.getByDate(d)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(saleService.getSaleDetail(id)));
    }

    @GetMapping("/credits")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getCredits() {
        return ResponseEntity.ok(ApiResponse.ok(saleService.getCredits()));
    }

    @PostMapping("/{id}/pay")
    public ResponseEntity<ApiResponse<Void>> recordPayment(
            @PathVariable Long id,
            @RequestBody Map<String, BigDecimal> body) {
        BigDecimal amount = body.getOrDefault("amount", BigDecimal.ZERO);
        saleService.recordPayment(id, amount);
        return ResponseEntity.ok(ApiResponse.ok(null, "Payment recorded"));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<Void>> cancel(@PathVariable Long id, @RequestBody java.util.Map<String, String> body) {
        saleService.cancelSale(id, body.get("pin"), body.get("reason"));
        return ResponseEntity.ok(ApiResponse.ok(null, "Sale cancelled"));
    }
}
